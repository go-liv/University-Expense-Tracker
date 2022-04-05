
/* register.js */

import { customiseNavbar, loadPage, showMessage, file2DataURI } from '../util.js'

export async function setup(node) {
	try {
		console.log('REGISTER: setup')
		console.log(node)
		document.querySelector('header p').innerText = 'Register an Account'
		customiseNavbar(['register', 'login'])
		node.querySelector('#registerForm').addEventListener('submit', await register)
	} catch(err) { // this will catch any errors in this script
		console.error(err)
	}
}

async function register() {
	event.preventDefault()
	const data = new FormData(event.target)
	
	const avatar = await file2DataURI(data.get('avatar'))
	console.log(avatar)
	const url = '/api/accounts'
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			'user': data.get('user'),
			'pass': data.get('pass'),
			'fullname': data.get('fullname'),
			'avatar': avatar
		})
	}
	const response = await fetch(url, options)
	const json = await response.json()
	if(response.status === 201) {
		showMessage('new account registered')
		await loadPage('login')
	}
	if(response.status === 409)  {
		showMessage('username already taken')
		await loadPage('register')
	}
}