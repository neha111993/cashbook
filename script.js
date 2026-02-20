let bookList = JSON.parse(localStorage.getItem('my_book_list')) || ['Primary'];
let currentBook = localStorage.getItem('last_active_book') || 'Primary';

document.getElementById('date').valueAsDate = new Date();

function updateBookTabs() {
    const tabsContainer = document.getElementById('book-tabs');
    tabsContainer.innerHTML = bookList.map(name => `
        <div class="book-tab ${name === currentBook ? 'active' : ''}" 
             onclick="switchBook('${name}')">
            ${name}
        </div>
    `).join('');
}

function switchBook(name) {
    currentBook = name;
    localStorage.setItem('last_active_book', name);
    updateBookTabs();
    updateUI();
}

function createNewBook() {
    const name = prompt("Enter New Book Name:");
    if (name && !bookList.includes(name)) {
        bookList.push(name);
        localStorage.setItem('my_book_list', JSON.stringify(bookList));
        switchBook(name);
    } else if (bookList.includes(name)) {
        alert("Book already exists!");
    }
}

function deleteCurrentBook() {
    if (bookList.length <= 1) return alert("You must have at least one book.");
    if (confirm(`Delete ALL data in "${currentBook}"?`)) {
        localStorage.removeItem(`data_${currentBook}`);
        bookList = bookList.filter(b => b !== currentBook);
        localStorage.setItem('my_book_list', JSON.stringify(bookList));
        switchBook(bookList[0]);
    }
}

// The addEntry, deleteEntry, and updateUI functions remain exactly 
// the same as the previous dynamic account logic.

function addEntry() {
    const date = document.getElementById('date').value;
    const desc = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = "General";

    if (!desc || isNaN(amount)) return alert("Fill all details");

    let entries = JSON.parse(localStorage.getItem(`data_${currentBook}`)) || [];
    entries.push({ id: Date.now(), date, desc, amount, type });
    
    localStorage.setItem(`data_${currentBook}`, JSON.stringify(entries));
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    updateUI();
}

function deleteEntry(id) {
    let entries = JSON.parse(localStorage.getItem(`data_${currentBook}`)) || [];
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem(`data_${currentBook}`, JSON.stringify(entries));
    updateUI();
}

function updateUI() {
    const entries = JSON.parse(localStorage.getItem(`data_${currentBook}`)) || [];
    const list = document.getElementById('entries');
    
    // Safety check: if the table list isn't found, stop here
    if (!list) return; 

    // Get filter and search values
    const filterMonth = document.getElementById('filter-month').value;
    const filterYear = document.getElementById('filter-year').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    list.innerHTML = "";
    
    let totalIn = 0, totalOut = 0;

    entries.forEach(e => {
        const entryDate = new Date(e.date);
        const entryMonth = entryDate.getMonth().toString();
        const entryYear = entryDate.getFullYear().toString();
        const entryNote = e.desc.toLowerCase();

        // Check Month, Year, AND Search Term
        const monthMatch = (filterMonth === "all" || entryMonth === filterMonth);
        const yearMatch = (entryYear === filterYear);
        const searchMatch = entryNote.includes(searchTerm);

        if (monthMatch && yearMatch && searchMatch) {
            const isIn = e.type === 'in';
            isIn ? totalIn += e.amount : totalOut += e.amount;

            // Simple table row without the <small> category tag
            list.innerHTML += `
                <tr>
                    <td style="width:28%; padding-left:10px;">${e.date.split('-').reverse().join('/')}</td>
                    <td style="width:40%;">${e.desc}</td>
                    <td class="type-${e.type}" style="width:22%; text-align:right;">₹${e.amount.toLocaleString('en-IN')}</td>
                    <td onclick="deleteEntry(${e.id})" style="width:10%; color:red; cursor:pointer; text-align:center;">✖</td>
                </tr>`;
        }
    });

    document.getElementById('balance').innerText = (totalIn - totalOut).toLocaleString('en-IN');
    document.getElementById('total-in').innerText = totalIn.toLocaleString('en-IN');
    document.getElementById('total-out').innerText = totalOut.toLocaleString('en-IN');
}

// --- SECURITY LOGIC ---
let savedPIN = localStorage.getItem('app_pin');

function checkPIN() {
    const input = document.getElementById('pin-input').value;
    
    if (!savedPIN) {
        // Set PIN for the first time
        if (input.length >= 4) {
            localStorage.setItem('app_pin', input);
            alert("PIN Set Successfully!");
            unlockApp();
        } else {
            alert("Set a PIN of at least 4 digits");
        }
    } else {
        // Verify existing PIN
        if (input === savedPIN) {
            unlockApp();
        } else {
            document.getElementById('lock-msg').innerText = "❌ Incorrect PIN";
            document.getElementById('pin-input').value = "";
        }
    }
}

function unlockApp() {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
}

// EXPORT: Bundles everything into a text string
function exportBackup() {
    const allData = {
        bookList: JSON.parse(localStorage.getItem('my_book_list')),
        pin: localStorage.getItem('app_pin'),
        accounts: {}
    };

    // Gather data for every book
    allData.bookList.forEach(book => {
        allData.accounts[`data_${book}`] = localStorage.getItem(`data_${book}`);
    });

    const dataStr = JSON.stringify(allData);
    
    // Copy to clipboard so user can WhatsApp it to themselves
    navigator.clipboard.writeText(dataStr).then(() => {
        alert("Backup code copied to clipboard! Save it in your notes or WhatsApp it to your new phone.");
    });
}

// IMPORT: Takes that text string and rebuilds the database
function importBackup() {
    const code = prompt("Paste your Backup Code here:");
    if (!code) return;

    try {
        const importedData = JSON.parse(code);

        if (confirm("This will overwrite all current data. Proceed?")) {
            // Restore PIN and Book List
            localStorage.setItem('my_book_list', JSON.stringify(importedData.bookList));
            localStorage.setItem('app_pin', importedData.pin);

            // Restore individual book data
            Object.keys(importedData.accounts).forEach(key => {
                localStorage.setItem(key, importedData.accounts[key]);
            });

            alert("Data Restored Successfully! The app will now reload.");
            window.location.reload();
        }
    } catch (err) {
        alert("Invalid Backup Code. Please make sure you copied the entire text.");
    }
}

function printBill() {
    // Add a temporary header for the printout
    const originalContent = document.body.innerHTML;
    const printHeader = `
        <div class="print-only-header" style="text-align:center; margin-bottom:20px;">
            <h1>CASHBOOK STATEMENT</h1>
            <p><strong>Account:</strong> ${currentBook}</p>
            <p><strong>Date of Report:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
            <hr>
        </div>
    `;
    
    // Trigger the browser print dialog
    window.print();
}

function saveBusinessName() {
    const name = document.getElementById('business-name').value;
    localStorage.setItem('cashbook_biz_name', name);
}

function loadBusinessName() {
    const savedName = localStorage.getItem('cashbook_biz_name');
    if (savedName) {
        document.getElementById('business-name').value = savedName;
    }
}

// Initialize
updateBookTabs();
updateUI();
loadBusinessName();


function resetPIN() {
    const currentSavedPIN = localStorage.getItem('app_pin');
    const oldPIN = prompt("Enter your CURRENT PIN to verify:");

    if (oldPIN === currentSavedPIN) {
        const newPIN = prompt("Enter your NEW PIN (at least 4 digits):");
        
        if (newPIN && newPIN.length >= 4) {
            localStorage.setItem('app_pin', newPIN);
            alert("PIN updated successfully!");
        } else {
            alert("Failed. New PIN must be at least 4 digits.");
        }
    } else {
        alert("Incorrect current PIN. Reset denied.");
    }
}

async function shareApp() {
    const shareData = {
        title: 'My Mobile Cashbook',
        text: 'Check out this easy-to-use Mobile Cashbook app for managing daily expenses!',
        url: window.location.href 
    };

    try {
        if (navigator.share) {
            // This triggers the mobile native share menu (WhatsApp, etc.)
            await navigator.share(shareData);
        } else {
            // Fallback for desktop browsers: Copy link to clipboard
            await navigator.clipboard.writeText(window.location.href);
            alert("App link copied to clipboard!");
        }
    } catch (err) {
        console.log('Error sharing:', err);
    }
}