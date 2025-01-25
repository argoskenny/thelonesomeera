// 選取表單與各欄位
const form = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const agreeCheckbox = document.getElementById("agree");

// 選取錯誤訊息的容器
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const phoneError = document.getElementById("phoneError");
const passwordError = document.getElementById("passwordError");
const agreeError = document.getElementById("agreeError");

// 密碼強度提示
const passwordStrength = document.getElementById("passwordStrength");

form.addEventListener("submit", function (e) {
    e.preventDefault(); // 先阻止表單送出

    // 每次送出前先將所有錯誤訊息隱藏
    hideError(nameError);
    hideError(emailError);
    hideError(phoneError);
    hideError(passwordError);
    hideError(agreeError);
    passwordStrength.style.display = "none";

    let isValid = true;

    // 驗證「Full Name」是否留空
    if (!fullNameInput.value.trim()) {
        showError(nameError, "Full Name is required");
        isValid = false;
    }

    // 驗證「Email」是否留空
    if (!emailInput.value.trim()) {
        showError(emailError, "Email is required");
        isValid = false;
    } else {
        // 簡易檢查 email 格式
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailInput.value.trim())) {
            showError(emailError, "Invalid email format");
            isValid = false;
        }
    }

    // 驗證「Phone Number」是否留空
    if (!phoneInput.value.trim()) {
        showError(phoneError, "Phone Number is required");
        isValid = false;
    }

    // 驗證「Password」是否留空以及格式（包含至少一個大寫字母與特殊符號）
    if (!passwordInput.value.trim()) {
        showError(passwordError, "Password is required");
        isValid = false;
    } else {
        const passwordValue = passwordInput.value;
        const uppercasePattern = /[A-Z]/;
        const specialCharPattern = /[^A-Za-z0-9]/; // 任一非字母數字視為特殊符號

        if (!uppercasePattern.test(passwordValue)) {
            showError(passwordError, "Must include at least one uppercase letter");
            isValid = false;
        } else if (!specialCharPattern.test(passwordValue)) {
            showError(passwordError, "Must include at least one special symbol");
            isValid = false;
        } else {
            // 如果通過密碼格式驗證，顯示強度提示
            passwordStrength.style.display = "block";
        }
    }

    // 驗證是否勾選同意條款
    if (!agreeCheckbox.checked) {
        showError(agreeError, "You must agree to the terms");
        isValid = false;
    }

    // 全部通過時即可送出或進行下一步處理
    if (isValid) {
        alert("Registration successful!");
        // 可以在此呼叫後端API或進行跳轉
        // form.submit(); // 若要真正送出表單可打開這行
    }
});

// 顯示錯誤訊息
function showError(element, message) {
    element.innerText = message;
    element.style.display = "block";
}

// 隱藏錯誤訊息
function hideError(element) {
    element.innerText = "";
    element.style.display = "none";
}