use crate::db::generated::job_lock;
use crate::{RepositoryError, RepositoryResult};
use sea_orm::prelude::*;
use sea_orm::sea_query::{OnConflict, Query, SimpleExpr};
use std::time::Duration;

pub struct JobLockRepository;

/// Postgres `interval` of `duration`.
fn interval(duration: Duration) -> SimpleExpr {
    // `$1` refers to this expression's own values, sea-query renumbers it in the statement
    Expr::cust_with_values("make_interval(secs => $1)", [duration.as_secs_f64()])
}

impl JobLockRepository {
    /// Acquires the lock for `ttl`, unless it's currently held. Returns whether it was acquired.
    ///
    /// This is a single atomic upsert evaluated on the database clock: concurrent callers are
    /// serialized by the primary key, so at most one of them can acquire an expired lock.
    pub async fn try_acquire<C: ConnectionTrait>(
        db: &C,
        name: &str,
        token: Uuid,
        ttl: Duration,
    ) -> RepositoryResult<bool> {
        let stmt = Query::insert()
            .into_table(job_lock::Entity)
            .columns([
                job_lock::Column::Name,
                job_lock::Column::Token,
                job_lock::Column::LockedAt,
                job_lock::Column::LockedUntil,
            ])
            .values_panic([
                name.into(),
                token.into(),
                Expr::current_timestamp().into(),
                Expr::current_timestamp().add(interval(ttl)),
            ])
            .on_conflict(
                OnConflict::column(job_lock::Column::Name)
                    .update_columns([
                        job_lock::Column::Token,
                        job_lock::Column::LockedAt,
                        job_lock::Column::LockedUntil,
                    ])
                    .action_and_where(
                        Expr::col((job_lock::Entity, job_lock::Column::LockedUntil))
                            .lte(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .to_owned();

        let result = db
            .execute(db.get_database_backend().build(&stmt))
            .await
            .map_err(RepositoryError::from)?;

        Ok(result.rows_affected() == 1)
    }

    /// Shortens the lock to `locked_at + hold`, if it's still held with `token`.
    /// Returns whether it was, i.e. it wasn't taken over in the meantime.
    pub async fn release<C: ConnectionTrait>(
        db: &C,
        name: &str,
        token: Uuid,
        hold: Duration,
    ) -> RepositoryResult<bool> {
        let result = job_lock::Entity::update_many()
            .col_expr(
                job_lock::Column::LockedUntil,
                Expr::col(job_lock::Column::LockedAt).add(interval(hold)),
            )
            .filter(job_lock::Column::Name.eq(name))
            .filter(job_lock::Column::Token.eq(token))
            .exec(db)
            .await
            .map_err(RepositoryError::from)?;

        Ok(result.rows_affected == 1)
    }
}
