// user-auth.js - User Authentication System

// User Management System
class UserManager {
    constructor() {
        this.currentUser = null;
        this.usersKey = 'beyondTheBenchUsers';
        this.currentUserKey = 'beyondTheBenchCurrentUser';
        this.initialize();
    }

    initialize() {
        // Load current user from localStorage
        const savedUser = localStorage.getItem(this.currentUserKey);
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                // Verify user still exists in users list
                const users = this.getUsers();
                const userExists = users.some(user => user.id === this.currentUser.id);
                if (!userExists) {
                    this.currentUser = null;
                    localStorage.removeItem(this.currentUserKey);
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
                this.currentUser = null;
                localStorage.removeItem(this.currentUserKey);
            }
        }
        this.updateNavbar();
       
    }

    // Get all users from localStorage
    getUsers() {
        try {
            const users = localStorage.getItem(this.usersKey);
            return users ? JSON.parse(users) : [];
        } catch (e) {
            console.error('Error getting users:', e);
            return [];
        }
    }

    // Save users to localStorage
    saveUsers(users) {
        try {
            localStorage.setItem(this.usersKey, JSON.stringify(users));
        } catch (e) {
            console.error('Error saving users:', e);
            this.showToast('Error saving user data', 'danger');
        }
    }

    // Validate email format
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        if (password.length < minLength) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!hasUpperCase || !hasLowerCase) {
            return { valid: false, message: 'Password must contain both uppercase and lowercase letters' };
        }
        if (!hasNumbers) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        
        return { valid: true, message: 'Password is strong' };
    }

    // Register a new user
    register(userData) {
        // Validate inputs
        if (!userData.firstName || !userData.lastName) {
            return { success: false, message: 'Please enter your full name' };
        }
        
        if (!this.validateEmail(userData.email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }
        
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.valid) {
            return { success: false, message: passwordValidation.message };
        }
        
        if (!userData.avatar) {
            return { success: false, message: 'Please select an avatar' };
        }

        const users = this.getUsers();
        
        // Check if email already exists
        if (users.some(user => user.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, message: 'Email already registered' };
        }

        // Create user object with hashed password (basic hash for demo)
        const newUser = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            email: userData.email.toLowerCase().trim(),
            password: this.hashPassword(userData.password), // Hash the password
            avatar: userData.avatar,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true
        };

        users.push(newUser);
        this.saveUsers(users);
        
        // Auto-login after registration
        const loginResult = this.login(userData.email, userData.password);
        if (loginResult.success) {
            return { success: true, user: newUser, message: 'Registration successful!' };
        } else {
            return loginResult;
        }
    }

    // Basic password hashing (for demo - use proper hashing in production)
    hashPassword(password) {
        // Simple hash for demo purposes
        return btoa(password + 'salt'); // In production, use proper hashing like bcrypt
    }

    // Verify password
    verifyPassword(inputPassword, storedPassword) {
        // For demo, compare the basic hash
        return this.hashPassword(inputPassword) === storedPassword;
    }

    // Login user
    login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Please enter email and password' };
        }

        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            // Verify password
            if (this.verifyPassword(password, user.password)) {
                // Update last login
                user.lastLogin = new Date().toISOString();
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex] = user;
                    this.saveUsers(users);
                }
                
                this.currentUser = user;
                try {
                    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
                } catch (e) {
                    console.error('Error saving user session:', e);
                }
                this.updateNavbar();
                return { success: true, user };
            }
        }
        
        return { success: false, message: 'Invalid email or password' };
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.currentUserKey);
        this.updateNavbar();
        this.showToast('Logged out successfully', 'success');
    }

   // Update navbar based on login state
updateNavbar() {
    const userNavSection = document.getElementById('userNavSection');
    if (!userNavSection) return;

    if (this.currentUser) {
        userNavSection.innerHTML = `
            <div class="dropdown user-dropdown">
                <a href="#"
                   class="dropdown-toggle user-toggle"
                   data-bs-toggle="dropdown"
                   aria-expanded="false">

                    <img src="${this.currentUser.avatar}"
                         alt="${this.currentUser.firstName}"
                         class="user-avatar"
                         onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=User&backgroundColor=b6e3f4'">

                    <span class="user-name d-none d-md-inline">
                        ${this.currentUser.firstName}
                    </span>
                </a>

                <ul class="dropdown-menu dropdown-menu-end user-menu">
                    <li class="px-3 py-2">
                        <small class="text-muted">Signed in as</small><br>
                        <strong>${this.currentUser.firstName} ${this.currentUser.lastName}</strong>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    
                    <li>
                        <a class="dropdown-item" href="#" id="logoutBtn">
                            <i class="bi bi-box-arrow-right"></i> Logout
                        </a>
                    </li>
                </ul>
            </div>
        `;

        setTimeout(() => {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        }, 50);

    } else {
        userNavSection.innerHTML = `
            <button class="btn btn-custom rounded-pill px-4 mt-lg-0 mt-3"
                    data-bs-toggle="modal"
                    data-bs-target="#NavModal">
                <i class="bi bi-person me-1"></i> Sign In
            </button>
        `;
    }
}

    // Show toast notification
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1060';
            document.body.appendChild(toastContainer);
        }
        
        const toastId = 'toast-' + Date.now();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        
        bsToast.show();
        
        // Remove toast from DOM after it hides
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }


    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize User Manager globally
window.userManager = new UserManager();

// Initialize form functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize avatar selection
    initializeAvatarSelection();
    
    // Setup password strength checker
    setupPasswordStrength();
    
    // Setup form handlers
    setupForms();
    
    // Setup forgot password
    setupForgotPassword();
    
    // Auto-switch to login if coming from registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        const registerTab = document.getElementById('register-tab');
        const loginTab = document.getElementById('login-tab');
        if (registerTab && loginTab) {
            registerTab.classList.remove('active');
            loginTab.classList.add('active');
            const registerPane = document.getElementById('register');
            const loginPane = document.getElementById('login');
            if (registerPane && loginPane) {
                registerPane.classList.remove('show', 'active');
                loginPane.classList.add('show', 'active');
            }
        }
    }
});

function initializeAvatarSelection() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const selectedAvatarInput = document.getElementById('selectedAvatar');
    
    if (!avatarOptions.length || !selectedAvatarInput) return;
    
    avatarOptions.forEach(avatar => {
        avatar.addEventListener('click', function() {
            // Remove selected class from all avatars
            avatarOptions.forEach(a => a.classList.remove('selected'));
            
            // Add selected class to clicked avatar
            this.classList.add('selected');
            
            // Set the selected avatar value
            selectedAvatarInput.value = this.src;
            selectedAvatarInput.classList.remove('is-invalid');
        });
    });
    
    // Select first avatar by default
    if (avatarOptions.length > 0 && !selectedAvatarInput.value) {
        avatarOptions[0].click();
    }
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    
    if (!passwordInput || !strengthBar || !strengthText) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        let text = 'None';
        let color = '#dc3545';
        
        // Length check
        if (password.length >= 8) strength++;
        // Uppercase & lowercase check
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        // Number check
        if (password.match(/\d/)) strength++;
        // Special character check
        if (password.match(/[^a-zA-Z\d]/)) strength++;
        
        // Update strength bar
        strengthBar.className = 'strength-bar';
        switch(strength) {
            case 0:
                text = 'None';
                color = '#dc3545';
                break;
            case 1:
                text = 'Weak';
                strengthBar.classList.add('weak');
                color = '#dc3545';
                break;
            case 2:
                text = 'Fair';
                strengthBar.classList.add('fair');
                color = '#fd7e14';
                break;
            case 3:
                text = 'Good';
                strengthBar.classList.add('good');
                color = '#ffc107';
                break;
            case 4:
                text = 'Strong';
                strengthBar.classList.add('strong');
                color = '#198754';
                break;
        }
        
        strengthText.textContent = `Password strength: ${text}`;
        strengthText.style.color = color;
        
        // Clear validation if password meets requirements
        if (strength >= 3) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
        }
    });
}

function setupForms() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = window.userManager.login(email, password);
            
            if (result.success) {
                window.userManager.showToast('Login successful!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('NavModal'));
                if (modal) modal.hide();
                loginForm.reset();
                loginForm.classList.remove('was-validated');
            } else {
                window.userManager.showToast(result.message, 'danger');
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const avatar = document.getElementById('selectedAvatar').value;
            const termsAgreed = document.getElementById('termsAgreement').checked;
            
            // Validate terms agreement
            if (!termsAgreed) {
                window.userManager.showToast('You must agree to the terms and conditions', 'warning');
                return;
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                document.getElementById('confirmPassword').classList.add('is-invalid');
                window.userManager.showToast('Passwords do not match', 'danger');
                return;
            }
            
            const userData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password: password,
                avatar: avatar
            };
            
            const result = window.userManager.register(userData);
            
            if (result.success) {
                window.userManager.showToast(result.message || 'Registration successful! Welcome!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('NavModal'));
                if (modal) modal.hide();
                registerForm.reset();
                registerForm.classList.remove('was-validated');
                // Reset avatar selection
                const avatarOptions = document.querySelectorAll('.avatar-option');
                if (avatarOptions.length > 0) {
                    avatarOptions.forEach(a => a.classList.remove('selected'));
                    avatarOptions[0].classList.add('selected');
                    document.getElementById('selectedAvatar').value = avatarOptions[0].src;
                }
                // Reset password strength
                const strengthBar = document.getElementById('passwordStrength');
                const strengthText = document.getElementById('strengthText');
                if (strengthBar) strengthBar.className = 'strength-bar';
                if (strengthText) {
                    strengthText.textContent = 'Password strength: None';
                    strengthText.style.color = '';
                }
            } else {
                window.userManager.showToast(result.message, 'danger');
            }
        });
    }
    
    // Real-time password match validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordInput = document.getElementById('registerPassword');
    
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (this.value !== passwordInput.value) {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    }
    
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !window.userManager.validateEmail(this.value)) {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            } else if (this.value) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    });
    
    // Name validation
    const nameInputs = document.querySelectorAll('input#firstName, input#lastName');
    nameInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim().length < 2) {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    });
}

function setupForgotPassword() {
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('NavModal'));
            if (loginModal) {
                loginModal.hide();
                
                setTimeout(() => {
                    const forgotModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
                    forgotModal.show();
                }, 300);
            }
        });
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            
            if (!window.userManager.validateEmail(email)) {
                window.userManager.showToast('Please enter a valid email address', 'warning');
                return;
            }
            
            // Check if email exists
            const users = window.userManager.getUsers();
            const userExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());
            
            if (userExists) {
                window.userManager.showToast(`Password reset link sent to ${email}`, 'info');
            } else {
                window.userManager.showToast('No account found with this email', 'warning');
            }
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            if (modal) modal.hide();
            this.reset();
        });
    }
}



