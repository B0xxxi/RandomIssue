// Пример массива заявок
let requests = [
    'Заявка #1: Позвонить клиенту Иванову',
    'Заявка #2: Отправить документы Петрову',
    'Заявка #3: Согласовать встречу с Сидоровым',
    'Заявка #4: Проверить оплату от ООО "Ромашка"',
    'Заявка #5: Подготовить отчет для директора'
];
let currentIndex = null;

const requestField = document.getElementById('requestField');
const randomBtn = document.getElementById('randomBtn');
const doneBtn = document.getElementById('doneBtn');
const addForm = document.getElementById('addForm');
const addInput = document.getElementById('addInput');
const requestList = document.getElementById('requestList');
const showListBtn = document.getElementById('showListBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const searchInput = document.getElementById('searchInput');
const uploadXlsxBtn = document.getElementById('uploadXlsxBtn');
const xlsxInput = document.getElementById('xlsxInput');
const deleteAllBtn = document.getElementById('deleteAllBtn');

let editIndex = null;
let editValue = '';

function renderList() {
    requestList.innerHTML = '';
    let filtered = requests;
    const search = searchInput.value.trim().toLowerCase();
    if (search) {
        filtered = requests.filter(r => (typeof r === 'string' ? r : r.text).toLowerCase().includes(search));
    }
    if (filtered.length === 0) {
        requestList.innerHTML = '<li>Нет заявок</li>';
        return;
    }
    filtered.forEach((req, idx) => {
        // поддержка старых строковых заявок
        const text = typeof req === 'string' ? req : req.text;
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        if (editIndex === idx) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = editValue;
            input.style.width = '220px';
            input.oninput = e => editValue = e.target.value;
            li.appendChild(input);
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Сохранить';
            saveBtn.style.marginLeft = '10px';
            saveBtn.onclick = () => {
                if (editValue.trim()) {
                    const realIdx = requests.findIndex(r => (typeof r === 'string' ? r : r.text) === text);
                    requests[realIdx] = {id: req.id || Date.now(), text: editValue};
                }
                editIndex = null;
                editValue = '';
                renderList();
                saveRequests();
            };
            li.appendChild(saveBtn);
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Отмена';
            cancelBtn.style.marginLeft = '5px';
            cancelBtn.onclick = () => {
                editIndex = null;
                editValue = '';
                renderList();
            };
            li.appendChild(cancelBtn);
        } else {
            const span = document.createElement('span');
            span.textContent = text;
            li.appendChild(span);
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Редактировать';
            editBtn.style.marginLeft = '10px';
            editBtn.onclick = () => {
                editIndex = idx;
                editValue = text;
                renderList();
            };
            li.appendChild(editBtn);
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Удалить';
            delBtn.style.marginLeft = '5px';
            delBtn.onclick = () => {
                const realIdx = requests.findIndex(r => (typeof r === 'string' ? r : r.text) === text);
                requests.splice(realIdx, 1);
                renderList();
                if (requests.length === 0) {
                    requestField.textContent = 'Все заявки выполнены!';
                    randomBtn.disabled = true;
                    doneBtn.disabled = true;
                }
                saveRequests();
            };
            li.appendChild(delBtn);
        }
        requestList.appendChild(li);
    });
    saveRequests();
}

function showRandomRequest() {
    if (requests.length === 0) {
        requestField.textContent = 'Все заявки выполнены!';
        randomBtn.disabled = true;
        doneBtn.disabled = true;
        return;
    }
    currentIndex = Math.floor(Math.random() * requests.length);
    const req = requests[currentIndex];
    requestField.textContent = typeof req === 'string' ? req : req.text;
    doneBtn.disabled = false;
}

function markAsDone() {
    if (currentIndex !== null && requests.length > 0) {
        requests.splice(currentIndex, 1);
        currentIndex = null;
        requestField.textContent = 'Заявка не выбрана';
        doneBtn.disabled = true;
        renderList();
        if (requests.length === 0) {
            requestField.textContent = 'Все заявки выполнены!';
            randomBtn.disabled = true;
        }
        saveRequests();
    }
}

addForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const value = addInput.value.trim();
    if (value) {
        requests.push({id: Date.now(), text: value});
        addInput.value = '';
        renderList();
        randomBtn.disabled = false;
        saveRequests();
    }
});

randomBtn.addEventListener('click', showRandomRequest);
doneBtn.addEventListener('click', markAsDone);

showListBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    renderList();
    searchInput.value = '';
});
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    editIndex = null;
    editValue = '';
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
        editIndex = null;
        editValue = '';
    }
});
searchInput.addEventListener('input', renderList);

uploadXlsxBtn.addEventListener('click', () => xlsxInput.click());
xlsxInput.addEventListener('change', handleXlsxUpload);

function sanitize(str) {
    return str.replace(/[<>"'`]/g, '').replace(/<.*?>/g, '').trim().slice(0, 100);
}

function normalizeHeader(str) {
    return str
        .toString()
        .toLowerCase()
        .replace(/\s|\u00A0/g, '') // обычные и неразрывные пробелы
        .replace(/["'`]/g, '');
}

function handleXlsxUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Можно загружать только файлы Excel (.xlsx, .xls)');
        return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2 МБ
        alert('Файл слишком большой (максимум 2 МБ)');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        let data;
        try {
            data = new Uint8Array(evt.target.result);
        } catch {
            alert('Ошибка чтения файла');
            return;
        }
        let workbook;
        try {
            workbook = XLSX.read(data, {type: 'array'});
        } catch {
            alert('Файл не похож на Excel');
            return;
        }
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
        console.log('Excel rows:', rows);
        if (rows.length < 2) return;
        // Найти строку с заголовками
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(10, rows.length); i++) {
            const row = rows[i];
            if (
                row[0] && normalizeHeader(row[0]).includes('номер') &&
                row[10] && normalizeHeader(row[10]).includes('контакт')
            ) {
                headerRowIdx = i;
                break;
            }
        }
        if (headerRowIdx === -1) {
            alert('Не найдена строка с заголовками "Номер" и "Контактное лицо".\nПервые строки: ' + rows.slice(0,5).map(r=>JSON.stringify(r)).join('\n'));
            return;
        }
        let added = 0;
        let firstDataRow = null;
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
            let num = rows[i][0];
            let contact = rows[i][10];
            if (!num && !contact) continue;
            if (!firstDataRow) firstDataRow = rows[i];
            if (!num || !contact) continue;
            num = sanitize(num.toString());
            contact = contact.toString();
            const lastSlashIdx = contact.lastIndexOf('/');
            if (lastSlashIdx !== -1) contact = contact.slice(lastSlashIdx + 1);
            contact = sanitize(contact);
            if (!num || !contact) continue;
            const text = `Заявка: ${num} — ${contact}`;
            if (!requests.some(r => r.text === text)) {
                requests.push({id: Date.now() + i, text});
                added++;
            }
        }
        if (added) {
            saveRequests();
            renderList();
            alert(`Добавлено заявок: ${added}`);
        } else {
            alert('Нет новых заявок для добавления.\nПример первой строки данных: ' + JSON.stringify(firstDataRow));
        }
    };
    reader.readAsArrayBuffer(file);
    xlsxInput.value = '';
}

function saveRequests() {
    localStorage.setItem('requests', JSON.stringify(requests));
}
function loadRequests() {
    const data = localStorage.getItem('requests');
    if (data) {
        try {
            requests = JSON.parse(data).map(r => typeof r === 'string' ? {id: Date.now(), text: r} : r);
        } catch (e) {
            requests = [];
        }
    }
}

// Вызов загрузки при старте
loadRequests();

deleteAllBtn.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите удалить все заявки? Это действие необратимо.')) {
        requests = [];
        saveRequests();
        renderList();
        requestField.textContent = 'Все заявки выполнены!';
        randomBtn.disabled = true;
        doneBtn.disabled = true;
    }
}); 