// Get the enter button
const enterBtn = document.getElementById('enter-btn');

// Add click event listener
enterBtn.addEventListener('click', () => {
  // Add a fade-out animation before navigating
  document.querySelector('.welcome-container').style.animation = 'fadeOut 0.5s ease-out';
  
  // Navigate to the main application after animation
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
});

// Optional: Add keyboard support (Enter key)
document.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    enterBtn.click();
  }
});

// Add fade-out animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);