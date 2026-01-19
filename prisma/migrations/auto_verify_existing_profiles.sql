-- Auto-verify existing profiles
UPDATE profiles SET isVerified = true, verifiedAt = NOW() WHERE isVerified = false;
