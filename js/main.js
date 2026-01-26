
const checkboxes = document.querySelectorAll('.filters input');

checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        document.querySelectorAll('.' + cb.value).forEach(event => {
            event.style.display = cb.checked ? 'block' : 'none';
        });
    });
});
