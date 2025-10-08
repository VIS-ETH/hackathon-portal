use aes_gcm::aead::Aead;
use aes_gcm::AeadCore;
use aes_gcm::KeyInit;
use aes_gcm::{
    aead::{consts::U12, OsRng},
    aes::Aes256,
    Aes256Gcm, AesGcm, Key, Nonce,
};
use serde::{Deserialize, Serialize};

use crate::ServiceResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CryptoConfig {
    pub key: String,
}

#[derive(Clone)]
pub struct CryptoService {
    cipher: AesGcm<Aes256, U12>,
}

impl CryptoService {
    #[must_use]
    pub fn new(key: String) -> Self {
        let master_key = hex::decode(key).expect("Failed to decode hex string");
        if master_key.len() != 32 {
            panic!("Crypto key must be 32 bytes (64 hex characters) long");
        }
        let key: &Key<Aes256Gcm> = master_key.as_slice().into();
        let cipher = Aes256Gcm::new(key);
        Self { cipher }
    }

    pub fn from_config(config: &CryptoConfig) -> ServiceResult<Self> {
        let result = CryptoService::new(config.key.clone());
        Ok(result)
    }

    pub fn encrypt(&self, plaintext: &str) -> ServiceResult<Vec<u8>> {
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = self.cipher.encrypt(&nonce, plaintext.as_bytes())?;
        let nonce_bytes = nonce.to_vec();
        Ok([nonce_bytes, ciphertext].concat())
    }

    pub fn decrypt(&self, ciphertext: &Vec<u8>) -> ServiceResult<String> {
        let (nonce, ciphertext) = ciphertext.split_at(12);
        let nonce = Nonce::from_slice(nonce);
        let plaintext = self.cipher.decrypt(nonce, ciphertext)?;
        let plaintext = String::from_utf8(plaintext).map_err(|_| crate::ServiceError::Parsing {
            message: "Failed to parse decrypted data as UTF-8 string".to_string(),
        })?;
        Ok(plaintext)
    }
}
