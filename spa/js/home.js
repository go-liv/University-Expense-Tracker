
/* home.js */

import { customiseNavbar, file2DataURI, loadPage, secureGet, showMessage } from '../util.js'

export async function setup(node, pageIndex) {
	console.log('Home: setup')
	try {
		console.log(node)
		if(localStorage.getItem('authorization') === null) {
			loadPage('login')
			return
		}
		// Managers only use this page for the expense description since it is equal in managers and users
		if(localStorage.getItem('role') === "1" && !(node.querySelector('#expenseDesc'))) loadPage('manager')
		if(localStorage.getItem('role') === "1") {
			customiseNavbar(['manager', 'logout'])
		} else {
			customiseNavbar(['home', 'logout'])
		}
		const json = await loadExpenses(node)
		if(node.querySelector('#expenseDesc')) {
			await loadExpenseDesc(node, json, pageIndex)
		} else {
			// Loads users expenses with the add expense button
			await createExpenseList(node, json)
		}
		if(!(node.querySelector('#add') === null)) node.querySelector('#add').addEventListener('click', await addExpense)
		// Receipt enlarging
		if(!(node.querySelector('#receipt') === null)) {
			node.querySelector('#receipt').addEventListener('click', await enlargeReceipt)
			node.querySelector('#resetReceipt').addEventListener('click', await reduceReceipt)
		}
	} catch(err) {
		console.error(err)
	}
}

// Get expenses according to the user 
async function loadExpenses(node) {
	console.log('Loading users expenses')
	const url = '/api/expenses'
	const options = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		}
	}
	const response = await fetch(url, options)
	if(response.status === 401) loadPage('login')
	const json = await response.json()
	
	return json
}

// Create list of expenses for the user
async function createExpenseList(node, expenses) {
	let totalAmount = 0
	expenses.info.forEach( (expense, i) => {
		totalAmount += expenses.info[i].amount
		/* We can use the index value to then iterate through 
		   the expense response and load the correct id in the expense description page */
		node.querySelector('#expenseList').innerHTML += 
		`<tr>
			<td>${expense.currDate.split('T',1)}</td>
			<td>${expense.incDate.split('T',1)}</td>
			<td><a href="/expense-${i}" id="${i}">${expense.label}</a></td>
			<td>${expense.amount}</td>
		</tr>`
	})
	node.querySelector('#expenseTotal').innerText = `Total expenses amount: \u00A3${totalAmount}`
}

// Create expense description according to the id of the expense (uses the index of the clicked object to grab the id)
async function loadExpenseDesc(node, expenses, pageIndex) {
	console.log(`id on loadExpenseDesc: ${expenses.info[pageIndex].id}`)
	const url = `/api/expenses/${expenses.info[pageIndex].id}`
	const options = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		}
	}
	const response = await fetch(url, options)
	if(response.status === 401) loadPage('login')
	const json = await response.json()
	
	// options for markdown converter
	const mdOpt = {
		'tables': true,
		'tasklists': true,
		'strikethrough': true
	}

	const converter = new showdown.Converter(mdOpt)

	// description will always be converted to html being markdown or just text
	const html = converter.makeHtml(json.expense[0].description)

	node.querySelector('#expenseDesc').innerHTML += 
	`
	<p><b> Incurrence date: </b> ${json.expense[0].incDate.split('T',1)}</p>
	<p><b> Category: </b> ${json.expense[0].category}</p>
	<p><b> Label: </b> ${json.expense[0].label}</p>
	<article id='descriptionBox'><b>Description:</b></br>${html}</article>
	<img src="${json.expense[0].receipt}" id="receipt" alt="Scanned receipt" width="150" height="75" />`
}

// Increase the scale of the receipt
async function enlargeReceipt(event) {
	event.preventDefault()
	const img = document.querySelector('#receipt')
	img.style.transform = 'scale(6)'
	img.style.margin = 'auto'
	img.style.postion = 'absolute'

	document.querySelector('#resetReceipt').innerText = 'Reset receipt size'
	document.querySelector('#resetReceipt').classList.remove('hidden')
	const reset = document.querySelector('#resetReceipt')
	reset.style.position = 'absolute'
	reset.style.left = '65%'
}

// Decrease the scale of the receipt
async function reduceReceipt(event) {
	event.preventDefault()
	const img = document.querySelector('#receipt')
	img.style.transform = 'scale(1)'
	document.querySelector('#resetReceipt').classList.add('hidden')
}

// Redirect user to the add expense page
async function addExpense(event) {
	console.log('func REDIR TO /addExpense')
	event.preventDefault()
	loadPage('addExpense')
}
