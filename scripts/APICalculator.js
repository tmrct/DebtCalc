let scheduleData = [];
let debtChart = null;

document.addEventListener("DOMContentLoaded", function () {
    renderSavedData();
    document.getElementById("calculateButton").addEventListener("click", calculateLoan);
    document.getElementById("saveButton").addEventListener("click", saveDataToFile);
});

function calculateLoan() {
    let loanAmount = parseFloat(document.getElementById("loanAmount").value);
    let interestRate = parseFloat(document.getElementById("interestRate").value) / 100 / 12;
    let duration = parseInt(document.getElementById("duration").value);
    let tableBody = document.querySelector("#scheduleTable tbody");
    tableBody.innerHTML = "";
    scheduleData = [];

    let monthlyPayment = loanAmount * interestRate / (1 - Math.pow(1 + interestRate, -duration));
    if (!isFinite(monthlyPayment)) monthlyPayment = 0;

    let month = 0;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    while (loanAmount > 0 && month < duration) {
        let interest = loanAmount * interestRate;
        let principal = monthlyPayment - interest;
        loanAmount -= principal;
        if (loanAmount < 0) loanAmount = 0;

        let monthIndex = (currentMonth + month) % 12;
        let year = currentYear + Math.floor((currentMonth + month) / 12);
        let formattedDate = new Date(year, monthIndex).toLocaleDateString("en-US", { month: 'long', year: 'numeric' });

        scheduleData.push({ date: formattedDate, payment: monthlyPayment, interest: interest, balance: loanAmount });
        month++;
    }
    renderTable();
}

function renderSavedData() {
    fetch('../data/scheduleData.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(parsedData => {
            scheduleData = Array.isArray(parsedData) ? parsedData : [];
            renderTable();
        })
        .catch(error => console.error('Error loading schedule data:', error));
}

function renderTable() {
    let tableBody = document.querySelector("#scheduleTable tbody");
    tableBody.innerHTML = "";
    let currentDate = new Date();

    scheduleData.forEach((entry, index) => {
        let entryDate = new Date(entry.date);
        let isBeforeToday = entryDate < currentDate;
        let row = `<tr${isBeforeToday ? ' style="background-color: #6dbfb8;"' : ''}>
            <td>${entry.date}</td>
            <td><input type="number" value="${entry.payment.toFixed(2)}" onchange="updatePayment(${index}, this.value)" /></td>
            <td>$${entry.interest.toFixed(2)}</td>
            <td>$${entry.balance.toFixed(2)}</td>
            <td><textarea style="height:60px;" onchange="updateDatePaid(${index}, this.value)">${entry.datePaid || ''}</textarea></td>
            </tr>`;
        tableBody.innerHTML += row;
    });
    calculateTotals();
    renderDebtGraph();
}

function updatePayment(index, newPayment) {
    newPayment = parseFloat(newPayment);
    if (isNaN(newPayment) || newPayment < 0) return;
    scheduleData[index].payment = newPayment;
    recalculateSchedule();
}

function updateDatePaid(index, newDatePaid) {
    scheduleData[index].datePaid = newDatePaid;
}

function recalculateSchedule() {
    let loanAmount = parseFloat(document.getElementById("loanAmount").value);
    let interestRate = parseFloat(document.getElementById("interestRate").value) / 100 / 12;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    for (let i = 0; i < scheduleData.length; i++) {
        let interest = loanAmount * interestRate;
        let principal = scheduleData[i].payment - interest;
        loanAmount -= principal;
        if (loanAmount < 0) loanAmount = 0;

        let monthIndex = (currentMonth + i) % 12;
        let year = currentYear + Math.floor((currentMonth + i) / 12);
        let formattedDate = new Date(year, monthIndex).toLocaleDateString("en-US", { month: 'long', year: 'numeric' });

        scheduleData[i].date = formattedDate;
        scheduleData[i].interest = interest;
        scheduleData[i].balance = loanAmount;
    }

    while (loanAmount > 0) {
        let interest = loanAmount * interestRate;
        let principal = scheduleData[scheduleData.length - 1].payment - interest;
        loanAmount -= principal;
        if (loanAmount < 0) loanAmount = 0;

        let lastEntry = scheduleData[scheduleData.length - 1];
        let lastDate = new Date(lastEntry.date);
        let nextMonth = lastDate.getMonth() + 1;
        let nextYear = lastDate.getFullYear();
        if (nextMonth > 11) {
            nextMonth = 0;
            nextYear++;
        }
        let formattedDate = new Date(nextYear, nextMonth).toLocaleDateString("en-US", { month: 'long', year: 'numeric' });

        scheduleData.push({ date: formattedDate, payment: lastEntry.payment, interest: interest, balance: loanAmount });
    }
    renderTable();
}
function calculateTotals() {
    let totalPaid = 0;
    let totalInterest = 0;
    let debtRemaining = 0;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    scheduleData.forEach((entry) => {
        let entryDate = new Date(entry.date);
        if ((entryDate.getFullYear() < currentYear || (entryDate.getFullYear() === currentYear && entryDate.getMonth() <= currentMonth)) && entry.datePaid) {
            totalPaid += entry.payment;
            totalInterest += entry.interest;
            debtRemaining = entry.balance;
        }
    });
    document.getElementById("totalPaid").textContent = totalPaid.toFixed(2);
    document.getElementById("totalInterest").textContent = totalInterest.toFixed(2);
    document.getElementById("debtRemaining").textContent = debtRemaining.toFixed(2);
}

async function saveDataToFile() {
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scheduleData.json";
    a.click();
    URL.revokeObjectURL(url);

    try {
        const response = await fetch('http://localhost:3000/data/scheduleData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: dataStr
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('Data successfully saved to server');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function renderDebtGraph() {
    if (debtChart) {
        debtChart.destroy(); // Destroy the existing chart instance
    }
    const ctx = document.getElementById('debtChart').getContext('2d');
    const labels = scheduleData.map(entry => entry.date);
    const paidData = scheduleData.map((entry, index) => {
        return scheduleData.slice(0, index + 1).reduce((sum, current) => sum + (current.payment - current.interest), 0);
    });
    const remainingData = scheduleData.map(entry => entry.balance);

    debtChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Debt Paid',
                    data: paidData,
                    borderColor: 'rgb(75, 192, 130)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false
                },
                {
                    label: 'Remaining Debt',
                    data: remainingData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    }
                }
            }
        }
    });
}
