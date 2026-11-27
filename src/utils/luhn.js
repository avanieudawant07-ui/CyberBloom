/**
 * Strip all non-digit characters from a candidate string.
 * @param {string} value
 * @returns {string}
 */
export function stripNonDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/**
 * Validate a payment card number using the Luhn (mod-10) algorithm.
 * Rejects numbers outside 13–19 digits and trivial all-identical-digit sequences.
 *
 * @param {string} rawCandidate
 * @returns {boolean}
 */
export function passesLuhn(rawCandidate) {
  const digits = stripNonDigits(rawCandidate);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  // Guard against trivial strings like 0000000000000000 which satisfy mod-10 trivially
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Produce a step-by-step educational breakdown of the Luhn checksum calculation.
 * @param {string} rawCandidate
 */
export function explainLuhn(rawCandidate) {
  const digits = stripNonDigits(rawCandidate);
  const lengthValid = digits.length >= 13 && digits.length <= 19;
  const trivialSequence = lengthValid && /^(\d)\1+$/.test(digits);

  const steps = [];
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    const original = Number(digits[i]);
    const doubled = shouldDouble ? original * 2 : original;
    const adjusted = doubled > 9 ? doubled - 9 : doubled;
    sum += adjusted;
    steps.unshift({
      index: i,
      original,
      doubled: shouldDouble,
      value: adjusted,
    });
    shouldDouble = !shouldDouble;
  }

  return {
    digits,
    lengthValid,
    trivialSequence,
    totalSum: sum,
    remainder: sum % 10,
    valid: lengthValid && !trivialSequence && sum % 10 === 0,
    steps,
  };
}

