use axum::http::HeaderMap;

const TRUSTED_ETHZ_DOMAINS: [&str; 3] = ["ethz.ch", "inf.ethz.ch", "student.ethz.ch"];

/// Ensures that all trusted ETH email addresses are normalized to the following format:
/// `username@ethz.ch` (in contrast to e.g. `username@student.ethz.ch`, `first.last@inf.ethz.ch` etc.)
///
/// # Warning
/// This function is only secure if the `username` and `auth_id` parameters are
/// guaranteed to originate from the same verified source (e.g., both are claims
/// within a single, validated JWT). Providing a `username` from an untrusted
/// source (like a request header) while `auth_id` is from a trusted source can
/// lead to authentication bypass vulnerabilities.
pub fn normalize_ethz_auth_id(auth_id: &str, username: &str) -> String {
    let lower_auth_id = auth_id.to_lowercase();
    let lower_username = username.to_lowercase();

    if let Some((_, domain)) = lower_auth_id.rsplit_once('@') {
        if TRUSTED_ETHZ_DOMAINS.contains(&domain) {
            return format!("{lower_username}@ethz.ch");
        }
    }

    auth_id.to_string()
}

/// Repairs names that were UTF-8 encoded but decoded as Latin-1 somewhere upstream,
/// e.g. `"MÃ¼ller"` becomes `"Müller"`.
///
/// Genuine names are left untouched: they either contain characters beyond Latin-1,
/// or their Latin-1 bytes do not form valid UTF-8 (e.g. `"Müller"` is `4D FC ...`).
pub fn repair_mojibake(name: &str) -> String {
    let bytes = name
        .chars()
        .map(|c| u8::try_from(c).ok())
        .collect::<Option<Vec<_>>>();

    match bytes.map(String::from_utf8) {
        Some(Ok(repaired)) => repaired,
        _ => name.to_string(),
    }
}

pub fn extract_header(headers: &HeaderMap, key: &str) -> Option<String> {
    headers.get(key).map(|value| {
        // value.to_str() apparently fails on non-ascii characters
        let bytes = value.as_bytes();
        let lossy = String::from_utf8_lossy(bytes);
        lossy.to_string()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn repair_mojibake_fixes_latin1_decoded_utf8() {
        assert_eq!(repair_mojibake("JosÃ© GarcÃ\u{AD}a"), "José García");
        assert_eq!(repair_mojibake("Ã\u{89}mile Ã\u{85}berg"), "Émile Åberg");
        assert_eq!(repair_mojibake("Å\u{9E}ule"), "Şule");
    }

    #[test]
    fn repair_mojibake_keeps_genuine_names() {
        for name in ["John Doe", "Müller", "Zoë Łukasz", "Ã"] {
            assert_eq!(repair_mojibake(name), name);
        }
    }
}
