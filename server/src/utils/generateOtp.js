import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * @returns {string} A 6-digit OTP string (e.g. "048291")
 */
export const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};
