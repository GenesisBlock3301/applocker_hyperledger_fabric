/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'addlocker1';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);



			// CREATE INDEVIDUAL ACCOUNT
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'FindUser', "nas@gmail.com","nas12345"
			// 	);
			// 	console.log(`Create Indevidual User1 already  exists\n, ${result}`);
			// } catch (error) {
			// 	let result = await contract.evaluateTransaction(
			// 		'CreateUser', 'user_nas@gmail.com', 'nas@gmail.com', 'nas12345', 'indevidual'
			// 	);
			// 	await contract.submitTransaction(
			// 		'CreateUser', 'user_nas@gmail.com', 'nas@gmail.com', 'nas12345', 'indevidual'
			// 	);
			// 	console.log(`Create Indevidual User1 successfully\n, ${result}`);
			// }

			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'FindUser', "nas1@gmail","nas12345"
			// 	);
			// 	console.log(`Create Indevidual User2 already  exists\n, ${result}`);
			// } catch (error) {
			// 	let result = await contract.evaluateTransaction(
			// 		'CreateUser', 'user_nas1@gmail.com', 'nas1@gmail.com', 'nas12345', 'indevidual'
			// 	);
			// 	await contract.submitTransaction(
			// 		'CreateUser', 'user_nas1@gmail.com', 'nas1@gmail.com', 'nas12345', 'indevidual'
			// 	);
			// 	console.log(`\n\nCreate Indevidual User2 successfully\n, ${result}`);
			// }

			// // FIND USER BY MAIL
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'FindUser', 'nas@gmail.com'
			// 	);
			// 	console.log(`\n\nUser found successfully:\n,     ${result}\n`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n\n    ${error}`);
			// }
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'ChangePassword', 'nas@gmail.com', "newPass");
			// 	await contract.submitTransaction(
			// 		'ChangePassword', 'nas@gmail.com', "newPass");
			// 	console.log(`\n\nChange Password successfully\n\n, ${result}`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error}`);
			// }

			// // CREATE LOCKER ROOM
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'CreateLockerRoom', 'locker_LocakerRoom-1', 'LockerRoom-1','nas@gmail.com',
			// 		"Health Department"
			// 	);
			// 	await contract.submitTransaction(
			// 		'CreateLockerRoom', 'locker_LocakerRoom-1', 'LockerRoom-1','nas@gmail.com',
			// 		"Health Department"
			// 	);
			// 	console.log(`\n\nCreate Locker Room successfully\n, ${result}`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught  Create Room the error: \n    ${error}`);
			// }

			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'CreateLockerRoom', 'locker_LocakerRoom-1', 'LockerRoom-2','nas@gmail.com',
			// 		"Health Department"
			// 	);
			// 	await contract.submitTransaction(
			// 		'CreateLockerRoom', 'locker_LocakerRoom-1', 'LockerRoom-2','nas@gmail.com',
			// 		"Health Department"
			// 	);
			// 	console.log(`\n\nCreate Locker Room successfully\n, ${result}`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error}`);
			// }
			// // FIND LOCKER ROOM
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'FindLockerRoom', 'LocakerRoom-1'
			// 	);
			// 	console.log(`\n\nFind Locker Room  successfully:\n,     ${result}\n`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n\n    ${error}`);
			// }

			// // LOCKER ROOM LISTS
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'LockerRoomList'
			// 	);
			// 	console.log(`\n\nFind All locker room successfully:\n,     ${result}\n`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n\n    ${error}`);
			// }

			// CREATE FILE AND SHARED
		
			try {
				let result = await contract.evaluateTransaction(
					'CreateFile', 'file_nas@gmail.com_myfile.txt', 'myfile.txt', 'LockerRoom-1',
					'/files/lockerroo/myfile.txt', 'hash_nas@gmail.com_myfile.txt', 'nas@gmail.com',
					'08/12/2021'
				);
				await contract.submitTransaction(
					'CreateFile', 'file_nas@gmail.com_myfile.txt', 'myfile.txt', 'LockerRoom-1',
					'/files/lockerroo/myfile.txt', 'hash_nas@gmail.com_myfile.txt', 'nas@gmail.com',
					'08/12/2021'
				);
				// SHARE
				await contract.submitTransaction(
					'ShareFile', 'shared_nas2@gmail.com_myfile.txt_hash', 'file_nas@gmail.com_myfile.txt',
					 'nas2@gmail.com'
				);
				await contract.submitTransaction(
					'ShareFile', 'shared_nas3@gmail.com_myfile.txt_hash', 'file_nas@gmail.com_myfile.txt',
					 'nas3@gmail.com'
				);
				console.log(`\n\nCreate File successfully\n, ${result}`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

		

		// USER APPROVAL REQUEST 
			try {
				let result = await contract.evaluateTransaction(
					'ApprovalRequest', 'file_nas@gmail.com_myfile.txt', "approved"
				);
				await contract.submitTransaction(
					'ApprovalRequest', 'file_nas@gmail.com_myfile.txt', "approved"
				);
				console.log(`\n\nCreate File successfully\n, ${result}`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			try {
				let result = await contract.evaluateTransaction(
					'ApprovalRequest', 'file_nas@gmail.com_myfile.txt', "decline"
				);
				await contract.submitTransaction(
					'ApprovalRequest', 'file_nas@gmail.com_myfile.txt', "decline"
				);
				console.log(`\n\nCreate File successfully\n, ${result}`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			// FIND FILE
			try {
				let result = await contract.evaluateTransaction(
					'FindFile', 'file_nas@gmail.com_myfile.txt'
				);
				console.log(`\n\nFind file  successfully:\n,     ${result}\n`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n\n    ${error}`);
			}

			// SHOW DOWNLOAD LINK OR NOT
			try {
				let result = await contract.evaluateTransaction(
					'FindFile', 'file_nas@gmail.com_myfile.txt'
				);
				let file = JSON.parse(result.toString())

				let findSharedFile = await contract.evaluateTransaction(
					'FindSharedFilesByFileKey', 'file_nas@gmail.com_myfile.txt'
				);
				let sharedFile = JSON.parse(findSharedFile.toString())
				let pending = sharedFile.length - (file.a_count+file.d_count)
				if (file.d_count > 0){
					console.log("Please amenden this file ...")
				}
				console.log(file)
				console.log(sharedFile)
				console.log(pending)

				console.log(`\n\nDownload link or Not:\n,     ${result}\n`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n\n    ${error}`);
			}
			// CREATE DPARTMENT

			try {
				let result = await contract.evaluateTransaction(
					'CreateDepartment', 'department_ParentDepartment','Parent Department', "Child department"
				);
				await contract.submitTransaction(
					'CreateDepartment', 'department_ParentDepartment','Parent Department', "Child department"
				);
				console.log(`\n\nCreate Department  successfully\n, ${result}`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}

			// DEPARTMENT LIST

			try {
				let result = await contract.evaluateTransaction(
					'DepartmentList'
				);
				await contract.submitTransaction(
					'DepartmentList'
				);
				console.log(`\n\nCreate Department List \n, ${result}`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n    ${error}`);
			}
				// FIND SHARED FILE WITH ME.
			try {
				let result = await contract.evaluateTransaction(
					"FindSharedFilesWithUser",
					"nas2@gmail.com"
				);
				console.log(`\n\nFind Share File with me  successfully:\n,     ${result}\n`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n\n    ${error}`);
			}

			// // LOCKER ROOM RELATED FILES
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'FindLockerRoomFiles', 'LockerRoom-1'
			// 	);
			// 	console.log(`\n\nLocker Room Related Files Successfully:\n\n\n,     ${result}\n`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n\n    ${error}`);
			// }

			// // CHANGE FILE NAME
			// try {
			// 	let result = await contract.submitTransaction(
			// 		'ChangeFileName', 'file_nas@gmail.com_myfile.txt', 'cert_new.txt', "newDownloadLink");
			// 	console.log(`\n\nChange File successfully\n\n, ${result}`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error}`);
			// }


			// // CREATE INDIVIDUAL SIGNATORY
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'CreateIndividualSignatory', 'ind_signatory_nas@gmail.com', 'Nur Amin', 'Sifat',
			// 		'nas@gmail.com', 'photoID', 'image.png', 'signature', 'member-1', 'other_file'
			// 	);
			// 	await contract.submitTransaction(
			// 		'CreateIndividualSignatory', 'ind_signatory_nas@gmail.com', 'Nur Amin', 'Sifat',
			// 		'nas@gmail.com', 'photoID', 'image.png', 'signature', 'member-1',  'other_file'
			// 	);
			// 	console.log(`\n\nCreate Signatory successfully\n, ${result}`);
			// } catch (error) {
			// 	console.log(`*** Successfully Create individual signatory caught the error: \n    ${error}`);
			// }


			// // FIND INDIVIDUAL SIGNATORY
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'FindSignatory', 'ind_signatory_nas@gmail.com'
			// 	);
			// 	console.log(`\n\nFind Signatory  successfully:\n,     ${result}\n`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n\n    ${error}`);
			// }

			// FIND USER'S FILE 
			try {
				let result = await contract.evaluateTransaction(
					'FindUserFiles', 'nas@gmail.com'
				);
				console.log(`\n\nFind USER'S FILE  successfully:\n,     ${result}\n`);
			} catch (error) {
				console.log(`*** Successfully Find Users File caught the error: \n\n    ${error}`);
			}

			// // SHARE FILEE WITH OTHER USER
			// try {
			// 	let result = await contract.evaluateTransaction(
			// 		'ShareFile', 'shared_myfile.txt_hash', 'file_nas@gmail.com_myfile.txt',
			// 		 'nas2@gmail.com'
			// 	);
			// 	await contract.submitTransaction(
			// 		'ShareFile', 'shared_myfile.txt_hash', 'file_nas@gmail.com_myfile.txt',
			// 		 'nas2@gmail.com'
			// 	);
			// 	console.log(`\n\nCreate share file successfully\n, ${result}`);
			// } catch (error) {
			// 	console.log(`*** Successfully caught the error: \n    ${error}`);
			// }

			// FindSharedFilesByFileKey
			try {
				let result = await contract.evaluateTransaction(
					'FindSharedFilesByFileKey', 'file_nas@gmail.com_myfile.txt'
				);
				console.log(`\n\nFind Shared Files By FileKey  successfully:\n\n,     ${result}\n`);
			} catch (error) {
				console.log(`*** Successfully Find Users File caught the error: \n\n    ${error}`);
			}


			// FIND SHARED FILES, HOW MANY FILES USER SHARED WITH OTHER user
			try {
				let result = await contract.evaluateTransaction(
					'FindSharedFilesWithUser', 'nas2@gmail.com'
				);
				console.log(`\n\nHOW MANY FILES USER SHARED WITH user  successfully:\n,     ${result}\n`);
			} catch (error) {
				console.log(`*** Successfully caught the error: \n\n    ${error}`);
			}
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();
