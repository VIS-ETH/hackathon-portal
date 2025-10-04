use derive_more::From;
use serde::Serialize;
use serde_with::{serde_as, DisplayFromStr};
use std::fmt::{self};

pub type RepositoryResult<T> = Result<T, RepositoryError>;

#[serde_as]
#[derive(Debug, Serialize, From)]
pub enum RepositoryError {
    EntityNotFound {
        entity: String,
        identifier: String,
    },

    Timeout {
        message: String,
    },

    // region: external library errors
    #[from]
    SeaORM(#[serde_as(as = "DisplayFromStr")] sea_orm::DbErr),

    #[from]
    S3Build(#[serde_as(as = "DisplayFromStr")] aws_sdk_s3::error::BuildError),

    #[from]
    S3PresigningConfig(
        #[serde_as(as = "DisplayFromStr")] aws_sdk_s3::presigning::PresigningConfigError,
    ),

    #[from]
    S3HeadObject(
        #[serde_as(as = "DisplayFromStr")]
        aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::head_object::HeadObjectError>,
    ),

    #[from]
    S3GetObject(
        #[serde_as(as = "DisplayFromStr")]
        aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::get_object::GetObjectError>,
    ),

    #[from]
    S3PutObject(
        #[serde_as(as = "DisplayFromStr")]
        aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::put_object::PutObjectError>,
    ),

    #[from]
    S3GetBucketCors(
        #[serde_as(as = "DisplayFromStr")]
        aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::get_bucket_cors::GetBucketCorsError>,
    ),

    #[from]
    S3PutBucketCors(
        #[serde_as(as = "DisplayFromStr")]
        aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::put_bucket_cors::PutBucketCorsError>,
    ),
    // endregion
}

impl fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{self:?}")
    }
}

impl std::error::Error for RepositoryError {}
