
const checkboxes = document.querySelectorAll('.filters input');

checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        document.querySelectorAll('.' + cb.value).forEach(event => {
            event.classList.toggle('hidden', !cb.checked);
        });
    });
});
