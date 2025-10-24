// Force Theme Debug Script
// Add this to debug theme switching issues

window.forceTheme = function (mode) {
    const html = document.documentElement;
    const body = document.body;

    console.log('Forcing theme to:', mode);

    if (mode === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
        html.style.background = '#000000';
        html.style.color = '#ffffff';
        body.style.background = 'inherit';
        body.style.color = 'inherit';
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
        html.style.background = 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)';
        html.style.color = '#0f172a';
        body.style.background = 'inherit';
        body.style.color = 'inherit';
        localStorage.setItem('theme', 'light');
    }

    console.log('HTML classes:', html.className);
    console.log('HTML style:', html.style.background, html.style.color);
};

// Test functions
window.testLight = () => forceTheme('light');
window.testDark = () => forceTheme('dark');

// Auto-test on load
setTimeout(() => {
    console.log('=== THEME DEBUG INFO ===');
    console.log('Current HTML classes:', document.documentElement.className);
    console.log('Current HTML background:', document.documentElement.style.background);
    console.log('Current body background:', document.body.style.background);
    console.log('localStorage theme:', localStorage.getItem('theme'));

    console.log('\n=== TEST COMMANDS ===');
    console.log('Run: testLight() to force light mode');
    console.log('Run: testDark() to force dark mode');
}, 1000);