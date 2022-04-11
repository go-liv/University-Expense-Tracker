/* logout.js */

import { customiseNavbar, loadPage, showMessage} from '../util.js'

export async function setup(node) {
	try {
		console.log('LOGOUT: setup')
		if(localStorage.getItem('authorization') === null) {
			loadPage('login')
			return
		}
		if (localStorage.getItem('role') === "1") customiseNavbar(['manager'])
		else customiseNavbar(['home'])
		node.querySelectorAll('button').forEach( button => button.addEventListener('click', event => {
			console.log(event.target.innerText)
			if(event.target.innerText === 'OK') {
				localStorage.removeItem('username')
				localStorage.removeItem('role')
				localStorage.removeItem('authorization')
				loadPage('login')
				showMessage('you are logged out')
			} else {
				loadPage('foo')
			}
		}))
	} catch(err) {
		console.error(err)
	}
}
