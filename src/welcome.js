// Get the enter button
const enterBtn = document.getElementById('enter-btn');
const welcomeContainer = document.querySelector('.welcome-container');
const welcomeContent = document.querySelector('.welcome-content');

// Add ripple effect on button click
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  ripple.style.top = `${event.clientY - button.offsetTop - radius}px`;
  ripple.classList.add('ripple');

  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: rippleEffect 0.6s ease-out;
      pointer-events: none;
    }
    
    @keyframes rippleEffect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  
  if (!document.querySelector('style[data-ripple]')) {
    rippleStyle.setAttribute('data-ripple', 'true');
    document.head.appendChild(rippleStyle);
  }

  const existingRipple = button.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(ripple);
}

// Add loading animation to button
function startLoading() {
  enterBtn.innerHTML = `
    <span class="button-text" style="opacity: 0.7;">Loading...</span>
    <span class="spinner"></span>
  `;
  
  const spinnerStyle = document.createElement('style');
  spinnerStyle.textContent = `
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  
  if (!document.querySelector('style[data-spinner]')) {
    spinnerStyle.setAttribute('data-spinner', 'true');
    document.head.appendChild(spinnerStyle);
  }
}

// Navigate to main application with smooth transition
function navigateToApp() {
  // Start loading animation
  startLoading();
  enterBtn.style.pointerEvents = 'none';
  
  // Add fade-out animation
  setTimeout(() => {
    welcomeContent.style.animation = 'contentFadeOut 0.5s ease-in forwards';
    welcomeContainer.style.animation = 'containerFadeOut 0.5s ease-in forwards';
    
    // Add fade-out animation styles
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
      @keyframes contentFadeOut {
        to {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
      }
      
      @keyframes containerFadeOut {
        to {
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(fadeOutStyle);
  }, 300);
  
  // Navigate after animation
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 900);
}

// Click event listener
enterBtn.addEventListener('click', (e) => {
  createRipple(e);
  setTimeout(navigateToApp, 100);
});

// Keyboard support (Enter key)
document.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    // Create a fake event for ripple effect at button center
    const rect = enterBtn.getBoundingClientRect();
    const fakeEvent = {
      currentTarget: enterBtn,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
    createRipple(fakeEvent);
    setTimeout(navigateToApp, 100);
  }
});

// Add hover sound effect (optional - visual feedback)
enterBtn.addEventListener('mouseenter', () => {
  enterBtn.style.transform = 'translateY(-3px) scale(1.02)';
});

enterBtn.addEventListener('mouseleave', () => {
  if (enterBtn.style.pointerEvents !== 'none') {
    enterBtn.style.transform = 'translateY(0) scale(1)';
  }
});

// Add particle effect on load (optional decorative element)
function createParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  `;
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      animation: float ${5 + Math.random() * 10}s ease-in-out infinite;
      animation-delay: ${Math.random() * 5}s;
    `;
    particlesContainer.appendChild(particle);
  }
  
  const floatStyle = document.createElement('style');
  floatStyle.textContent = `
    @keyframes float {
      0%, 100% {
        transform: translateY(0) translateX(0);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      50% {
        transform: translateY(-100px) translateX(${Math.random() * 100 - 50}px);
      }
    }
  `;
  document.head.appendChild(floatStyle);
  document.body.appendChild(particlesContainer);
}

// Initialize particles
createParticles();

// Add smooth scroll reveal for footer items
const footerItems = document.querySelectorAll('.info-item');
footerItems.forEach((item, index) => {
  item.style.opacity = '0';
  item.style.transform = 'translateY(10px)';
  setTimeout(() => {
    item.style.transition = 'all 0.5s ease';
    item.style.opacity = '1';
    item.style.transform = 'translateY(0)';
  }, 1300 + (index * 100));
});

// Prevent multiple clicks
let isNavigating = false;
enterBtn.addEventListener('click', (e) => {
  if (isNavigating) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  isNavigating = true;
});

console.log('%cScientech Semiconductor Lab', 'color: #4a6fa5; font-size: 20px; font-weight: bold;');
console.log('%cV-I Characteristics Analysis Tool v1.0', 'color: #6c757d; font-size: 14px;');
console.log('%cReady to analyze...', 'color: #28a745; font-size: 12px;');