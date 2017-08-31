'use strict';

const pageForm = document.querySelector('#myForm');
const pageFormElements = Array.from(pageForm.elements);
const pageFormSubmit = pageForm.querySelector('#submitButton');
const resultContainer = document.querySelector('#resultContainer');


// getData
window.myForm.getData = (function (form) {
    const s = [];
    pageFormElements.forEach((field) => {
        if (field.name && !field.disabled && field.type !== 'file' && field.type !== 'reset' && field.type !== 'submit' && field.type !== 'button') {
            if (field.type === 'select-multiple') {
                const optionsArr = field.options;
                optionsArr.forEach((option) => {
                    if (option.selected){
                        s[s.length] = {
                            [field.name]: option.value
                        };
                    }
                });
            } else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
                s[s.length] = {
                    [field.name]: field.value
                };
            }
        }
    });
    return s;
})

// setData
window.myForm.setData = (function (data) {
    if (typeof data === 'object') {
        for (const property in data) {
            if (data.hasOwnProperty(property) && (property === 'fio' || property === 'phone' || property === 'email')) {
                pageFormElements.forEach((field) => {
                    if (property === field.name) {
                        field.value = data[property];
                    }
                });
            }
        }
    }
})

// Submit
window.myForm.submit = (function (e) {    
    
    const sendRequest = function (action) {
        fetch(action).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response is not ok');
        }).then(function (response) {
            pageFormSubmit.disabled = false;
            if (response.status) {
                resultContainer.classList.add(response.status);
            }
            if (response.status === 'success') {
                resultContainer.textContent = 'Success';
            }
            if (response.reason) {
                resultContainer.textContent = response.reason;
            }
            if (response.timeout) {
                setTimeout(function () {
                    sendRequest(action);
                }, response.timeout);
            }
        }).catch(function (error) {
            pageFormSubmit.disabled = false;
            console.log('There has been a problem with your fetch operation: ' + error.message);
        });
    };

    const validationResult = window.myForm.validate();
    if (validationResult.isValid) {
        pageFormSubmit.disabled = true;
        sendRequest(pageForm.action);
    }
})

// Validate
window.myForm.validate = (function () {

    const validations = {
        required: function (value) {
            if (value === '') {
                return [false, 'Пожалуйста, заполните поле'];
            }
            return [true];
        },
        fio: function (value) {
            const isFieldFilled = this.required(value);
            if (isFieldFilled[0]) {
                const fioParts = value.trim().split(' ');
                if (fioParts.length !== 3) {
                    return [false, 'Укажите ровно три слова']
                }
                return [true]
            }
            return isFieldFilled;
        },
        phone: function (value) {
            const isFieldFilled = this.required(value);
            if (isFieldFilled[0]) {
                const phoneRegex = /^\+7\((\d{3})\)(\d{3})-(\d{2})-(\d{2})$/;
                if (!value.match(phoneRegex)) {
                    return [false, 'Пожалуйста, введите телефон в формате +7(999)999-99-99'];
                }
                const numbers = value.replace(/[\+()-]/g, '').split('');
                const total = numbers.reduce((sum, item) => {
                    sum += parseInt(item, 10);
                    return sum;
                }, 0);
                if (total > 30) {
                    return [false, 'Cумма всех цифр телефона не должна превышать 30']
                }
                return [true];
            }
            return isFieldFilled;
        },
        email: function (value) {
            const isFieldFilled = this.required(value);
            if (isFieldFilled[0]) {
                const emailRegex = /[A-Za-z0-9_-]+(?:\.[A-Za-z0-9=?^_`{|}~-]+)*@(ya.ru|yandex.ru|yandex.ua|yandex.by|yandex.kz|yandex.com)$/;
                if (!value.match(emailRegex)) {
                    return [false, 'Пожалуйста, используйте email в доменах ya.ru, yandex.ru, yandex.ua, yandex.by, yandex.kz, yandex.com']
                }
                return [true];
            }
            return isFieldFilled;
        }
    };

    const errorFields = [];
    let isValid = true;

    const errorMessages = pageForm.querySelectorAll('div.error:not(#resultContainer)');
    errorMessages.forEach((message) => {
        message.parentNode.removeChild(message);
    });

    pageFormElements.forEach((input) => {
        input.classList.remove('error');
        if (validations.hasOwnProperty(input.name)) {
            const validationResult = validations[input.name](input.value);
            if (!validationResult[0]) {
                isValid = false;
                errorFields.push(input.name);
                input.classList.add('error');
                input.insertAdjacentHTML('afterend', `<div class="error">${validationResult[1]}</div>`);
            }
        }
    });
    return { isValid: isValid, errorFields: errorFields}
})

pageForm.addEventListener('submit', function(e) {
    e.preventDefault();
    window.myForm.submit();
});
