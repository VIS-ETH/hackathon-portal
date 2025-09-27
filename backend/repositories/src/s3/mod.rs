use crate::RepositoryResult;
use aws_sdk_s3::config::{Credentials, Region};
use aws_sdk_s3::operation::get_bucket_cors::GetBucketCorsOutput;
use aws_sdk_s3::operation::head_object::HeadObjectOutput;
use aws_sdk_s3::presigning::PresigningConfig;
use aws_sdk_s3::types::{CorsConfiguration, CorsRule};
use aws_sdk_s3::{Client, Config};
use mime::Mime;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct S3Config {
    pub endpoint: String,
    pub bucket: String,
    pub region: String,
    pub path_style: bool,
    pub access_key: String,
    pub secret_key: String,
}

#[derive(Clone)]
pub struct S3Repository {
    client: Client,
    bucket: String,
}

impl S3Repository {
    #[must_use]
    pub fn new(client: Client, bucket: String) -> Self {
        Self { client, bucket }
    }

    #[must_use]
    pub fn from_config(config: &S3Config) -> Self {
        let bucket = config.bucket.clone();

        let credentials = Credentials::new(
            config.access_key.clone(),
            config.secret_key.clone(),
            None,
            None,
            "credentials",
        );

        let config = Config::builder()
            .credentials_provider(credentials)
            .endpoint_url(config.endpoint.clone())
            .region(Some(Region::new(config.region.clone())))
            .force_path_style(config.path_style)
            .build();

        let client = Client::from_conf(config);

        Self::new(client, bucket)
    }

    pub async fn get_bucket_cors(&self) -> RepositoryResult<GetBucketCorsOutput> {
        let cors = self
            .client
            .get_bucket_cors()
            .bucket(&self.bucket)
            .send()
            .await?;

        Ok(cors)
    }

    pub async fn put_bucket_cors(&self, allowed_origins: &[String]) -> RepositoryResult<()> {
        let allowed_methods = vec![
            "GET".to_string(),
            "PUT".to_string(),
            "POST".to_string(),
            "HEAD".to_string(),
        ];

        let allowed_request_headers = vec![
            "Content-Type".to_string(),
            "Content-Length".to_string(),
            "Authorization".to_string(),
            "X-Amz-*".to_string(),
        ];

        let allowed_response_headers = vec!["ETag".to_string(), "Accept-Ranges".to_string()];

        let cors_rule = CorsRule::builder()
            .set_allowed_methods(Some(allowed_methods))
            .set_allowed_origins(Some(allowed_origins.to_vec()))
            .set_allowed_headers(Some(allowed_request_headers))
            .set_expose_headers(Some(allowed_response_headers))
            .max_age_seconds(600)
            .build()?;

        let cors_configuration = CorsConfiguration::builder().cors_rules(cors_rule).build()?;

        self.client
            .put_bucket_cors()
            .bucket(&self.bucket)
            .cors_configuration(cors_configuration)
            .send()
            .await?;

        Ok(())
    }

    pub async fn head_object(&self, key: &str) -> RepositoryResult<HeadObjectOutput> {
        let response = self
            .client
            .head_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await?;

        Ok(response)
    }

    pub async fn presign_get_object(
        &self,
        key: &str,
        expires_in: Duration,
    ) -> RepositoryResult<String> {
        let config = PresigningConfig::builder().expires_in(expires_in).build()?;

        let response = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .presigned(config)
            .await?;

        let url = response.uri().to_string();

        Ok(url)
    }

    pub async fn presign_put_object(
        &self,
        key: &str,
        content_type: Option<&Mime>,
        content_length: Option<i64>,
        expires_in: Duration,
    ) -> RepositoryResult<String> {
        let config = PresigningConfig::builder().expires_in(expires_in).build()?;

        let mut request = self.client.put_object().bucket(&self.bucket).key(key);

        if let Some(content_type) = content_type {
            request = request.content_type(content_type.to_string());
        }

        if let Some(content_length) = content_length {
            request = request.content_length(content_length);
        }

        let response = request.presigned(config).await?;

        let url = response.uri().to_string();

        Ok(url)
    }
}
