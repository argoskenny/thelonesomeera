document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signup-form');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const phoneNumberInput = document.getElementById('phone-number');
    const passwordInput = document.getElementById('password');
    const termsCheckbox = document.getElementById('terms');

    const fullNameError = document.getElementById('full-name-error');
    const emailError = document.getElementById('email-error');
    const phoneNumberError = document.getElementById('phone-number-error');
    const passwordError = document.getElementById('password-error');

    const passwordToggle = document.getElementById('password-toggle');
    let passwordVisible = false;

    const strengthIndicator = document.getElementById('strength-indicator');
    const strengthText = document.getElementById('strength-text');
    const passwordStrengthContainer = document.getElementById('password-strength');


    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        let isValid = true;

        // Reset error messages and styles
        resetValidation(fullNameInput, fullNameError);
        resetValidation(emailInput, emailError);
        resetValidation(phoneNumberInput, phoneNumberError);
        resetValidation(passwordInput, passwordError);

        // Validate Full Name
        if (fullNameInput.value.trim() === '') {
            showError(fullNameInput, fullNameError, 'Full Name cannot be empty.');
            isValid = false;
        }

        // Validate Email
        if (emailInput.value.trim() === '') {
            showError(emailInput, emailError, 'Email cannot be empty.');
            isValid = false;
        } else if (!isValidEmail(emailInput.value.trim())) {
            showError(emailInput, emailError, 'Invalid email format.');
            isValid = false;
        }

        // Validate Phone Number
        if (phoneNumberInput.value.trim() === '') {
            showError(phoneNumberInput, phoneNumberError, 'Phone Number cannot be empty.');
            isValid = false;
        }

        // Validate Password
        if (passwordInput.value.trim() === '') {
            showError(passwordInput, passwordError, 'Password cannot be empty.');
            isValid = false;
        } else if (!isValidPassword(passwordInput.value.trim())) {
            showError(passwordInput, passwordError, 'Password must contain at least one uppercase letter and one special symbol.');
            isValid = false;
        }

        if (!termsCheckbox.checked) {
            alert('Please agree to the Terms of Service and Privacy Policy.'); // Simple alert for terms agreement
            isValid = false;
        }


        if (isValid) {
            alert('Sign up successful!'); // Replace with actual form submission logic
            // form.submit(); // Uncomment this to actually submit the form if needed
        }
    });

    function resetValidation(inputElement, errorElement) {
        inputElement.parentElement.classList.remove('error');
        errorElement.textContent = '';
    }

    function showError(inputElement, errorElement, message) {
        inputElement.parentElement.classList.add('error');
        errorElement.textContent = message;
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPassword(password) {
        const uppercaseRegex = /[A-Z]/;
        const specialSymbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
        return uppercaseRegex.test(password) && specialSymbolRegex.test(password);
    }


    // Password visibility toggle
    passwordToggle.addEventListener('click', function () {
        passwordVisible = !passwordVisible;
        if (passwordVisible) {
            passwordInput.type = 'text';
            passwordToggle.classList.add('visible');
        } else {
            passwordInput.type = 'password';
            passwordToggle.classList.remove('visible');
        }
    });


    // Password strength check
    passwordInput.addEventListener('input', function () {
        const password = passwordInput.value;
        let strength = 0;
        if (password.length > 6) strength++; // Basic length check
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++; // Mix of case
        if (/[0-9]/.test(password)) strength++; // Contains numbers
        if (/[^a-zA-Z0-9]/.test(password)) strength++; // Contains special characters

        updateStrengthMeter(strength);
    });

    function updateStrengthMeter(strengthLevel) {
        let strengthPercentage = 0;
        let strengthColor = '#e57373'; // Weak default color
        let strengthMessage = 'Weak';

        switch (strengthLevel) {
            case 0: strengthPercentage = 0; strengthMessage = 'Very Weak'; strengthColor = '#e57373'; break;
            case 1: strengthPercentage = 25; strengthMessage = 'Weak'; strengthColor = '#e57373'; break;
            case 2: strengthPercentage = 50; strengthMessage = 'Medium'; strengthColor = '#ffca28'; break;
            case 3: strengthPercentage = 75; strengthMessage = 'Strong'; strengthColor = '#4caf50'; break;
            case 4: strengthPercentage = 100; strengthMessage = 'Strong'; strengthColor = '#4caf50'; break;
        }

        strengthIndicator.style.width = `${strengthPercentage}%`;
        strengthIndicator.className = `strength-indicator ${getStrengthClass(strengthLevel)}`; // Update class for color
        strengthText.textContent = strengthMessage;
    }

    function getStrengthClass(strengthLevel) {
        if (strengthLevel <= 1) return 'weak';
        if (strengthLevel === 2) return 'medium';
        return 'strong'; // strengthLevel >= 3 is considered strong
    }


});