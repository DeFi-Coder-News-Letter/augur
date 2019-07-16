export function isFilledString(value, readable, message) {
  if (value.trim().length > 0 && value !== "") return "";
  return message ? message : readable + " is required";
}

export function isMaxLength(value, maxLength) {
  return maxLength && value.length > maxLength;
}

export function isFilledNumber(value, readable, message) {
  if (value && value !== "") return "";
  return message ? message : readable + " is required";
}

export function isBetween(value, readable, min, max) {
  if (value > max) {
    return readable + " must be less than " + max;
  } else if (value < min) {
    return readable + " must be more than " + min;
  }
  return "";
}

export function checkCategoriesArray(value) {
  let errors = ["", "", ""];
  if (value[0] === "") {
    errors[0] = "Please choose a category";
  }
  if (value[1] === "") {
    errors[1] = "Please choose a sub-category";
  }

  if (errors[0] !== "" || errors[1] !== "") {
    return errors;
  } else {
    return "";
  }
}