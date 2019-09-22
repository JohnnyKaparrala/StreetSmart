module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "M": "readonly",
        "plugin": "readonly",
        "cordova": "readonly",
        "StatusBar": "readonly",
        "Keyboard": "readonly",
        "nativegeocoder": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 5,
        "sourceType": "script"
    },
    "rules": {
        "no-unused-vars": "warn"
    }
};