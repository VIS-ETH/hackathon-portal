use sea_orm::TryInsertResult;

pub fn try_insert_result_to_int<T: Default>(result: TryInsertResult<T>) -> T {
    match result {
        TryInsertResult::Empty => Default::default(),
        TryInsertResult::Conflicted => Default::default(),
        TryInsertResult::Inserted(n) => n,
    }
}
