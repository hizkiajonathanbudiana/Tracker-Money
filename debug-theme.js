// Debug Theme Switcher
// Open browser console and run this to debug theme issues

console.log('=== THEME DEBUG ===');
console.log('1. Current HTML class:', document.documentElement.className);
console.log('2. Current theme from localStorage:', localStorage.getItem('theme'));
console.log('3. System dark mode preference:', window.matchMedia('(prefers-color-scheme: dark)').matches);

// Test theme switching
function testThemeSwitch() {
    const html = document.documentElement;
    console.log('Before toggle - HTML classes:', html.className);

    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        console.log('Switched to LIGHT mode');
    } else {
        html.classList.add('dark');
        console.log('Switched to DARK mode');
    }

    console.log('After toggle - HTML classes:', html.className);
}

// Run this in console to manually test theme switching
console.log('Run testThemeSwitch() to manually test theme switching');
window.testThemeSwitch = testThemeSwitch;

// Monitor theme changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            console.log('HTML class changed:', document.documentElement.className);
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
});

console.log('Theme monitoring active. Check console for theme changes.');