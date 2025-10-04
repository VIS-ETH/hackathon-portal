use sea_orm::TryInsertResult;

pub trait TryInsertResultExt<T> {
    fn unwrap_or_default(self) -> T;
}

impl<T> TryInsertResultExt<T> for TryInsertResult<T>
where
    T: Default,
{
    fn unwrap_or_default(self) -> T {
        match self {
            TryInsertResult::Inserted(model) => model,
            TryInsertResult::Empty | TryInsertResult::Conflicted => T::default(),
        }
    }
}
