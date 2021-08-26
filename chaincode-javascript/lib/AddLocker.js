'use strict';

const { Contract } = require('fabric-contract-api');

class AddLocker extends Contract {

    // CREATE USER
    async CreateUser(ctx, key, email, password, role) {
        const user = {
            key: key, email: email, password: password, role: role,
            docType: 'user', isLoggedIn: false
        };
        ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
        return JSON.stringify(user);
    }

    // CHANGE PASSWORD
    async ChangePassword(ctx, email, newPassword) {
        let key = `user_${email}`;
        const userJSON = await ctx.stub.getState(key);
        if (!userJSON || userJSON.length === 0) {
            throw new Error(`The asset ${key} does not exist`);
        }
        let user = JSON.parse(userJSON.toString());
        user.password = newPassword;
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
        return JSON.stringify(user);
    }



    // FIND USER
    async FindUser(ctx, email) {
        let key = `user_${email}`;
        const userJSON = await ctx.stub.getState(key); // get the user from chaincode state
        if (!userJSON || userJSON.length === 0) {
            throw new Error(`The user with this ${email} does not exist`);
        }
        return userJSON.toString();
    }


    // CREATE INDIVIDUAL SIGNATORY
    async CreateIndividualSignatory(ctx, key, firstName, lastName, email, photoIdCard, photo, signature, member, other) {
        const signatory = {
            key: key, firstName: firstName, lastName: lastName, email: email,
            photoIdCard: photoIdCard, photo: photo, signature: signature,
            member: member, other: other, docType: 'indevidual_signatory'
        };
        ctx.stub.putState(key, Buffer.from(JSON.stringify(signatory)));
        return JSON.stringify(signatory);
    }

    // CREATE PROFESSIONAL AND COMPANIES SIGNATORY
    async CreateProCoSignatory(ctx, key, name, email, photoIdCard, photo, signature, member,stamp,other) {
        const signatory = {
            key: key, name:name,email: email,
            photoIdCard: photoIdCard, photo: photo, signature: signature,
            stamp: stamp, member: member, other: other, docType: 'pro_co_signatory'
        };
        ctx.stub.putState(key, Buffer.from(JSON.stringify(signatory)));
        return JSON.stringify(signatory);
    }

    //FIND SIGNATORY
    async FindSignatory(ctx, key) {
        const lockerJSON = await ctx.stub.getState(key);
        if (!lockerJSON || lockerJSON.length === 0) {
            throw new Error(`The file with ${key} does not exist`);
        }
        return lockerJSON.toString();
    }

     // ADD DEPARTMENT
     async CreateDepartment(ctx, key,parentDept,childDept ) {
        const department = {
            key: key,parentDept:parentDept,childDept:childDept,docType: 'department',
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(department)));
        return JSON.stringify(department);
    }

    // FIND DEPARTMENT
    async FindDepartment(ctx, key) {
        const departmentJSON = await ctx.stub.getState(key); // get the user from chaincode state
        if (!departmentJSON || departmentJSON.length === 0) {
            throw new Error(`The deparment with this ${key} does not exist`);
        }
        return departmentJSON.toString();
    }

    // DEPARMENT LIST
    async DepartmentList(ctx) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'department';
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // CREATE LOCAKER ROOM
    async CreateLockerRoom(ctx, key, name,email,department) {
        const lockerRoom = {
            key: key, name: name,email:email,
            department:department,docType: 'locker_room',
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(lockerRoom)));
        return JSON.stringify(lockerRoom);
    }

    // LOCKER ROOM LIST
    async LockerRoomList(ctx) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'locker_room';
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }



    // FIND LOCKER ROOM
    async FindLockerRoom(ctx, name) {
        const key = `locker_${name}`
        const lockerJSON = await ctx.stub.getState(key);
        if (!lockerJSON || lockerJSON.length === 0) {
            throw new Error(`The file with ${key} does not exist`);
        }
        return lockerJSON.toString();
    }

    // NEW ADD START---------------

    // FIND LOCKERROOM'S FILES
    async FindLockerRoomFiles(ctx, lockerRoom) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'file';
        queryString.selector.lockerRoom = lockerRoom;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // CREATE FILE
    async CreateFile(ctx, key, name, lockerRoom, downloadLink, fileHash, uploaderEmail,expireDate) {
        const file = {
            key: key, name: name, downloadLink: downloadLink,
            fileHash: fileHash, lockerRoom: lockerRoom,
            uploaderEmail: uploaderEmail,a_count:0,
            d_count:0,p_count:0,
            docType: 'file',expireDate: expireDate
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file);
    }

    // APPROVAL REQUEST
    async ApprovalRequest(ctx, key,approvalStatus) {
        const fileJSON = await ctx.stub.getState(key);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The file ${key} does not exist`);
        }
        let file = JSON.parse(fileJSON.toString());
        if(approvalStatus === "approved"){
            file.a_count += 1
        }
        else if (approvalStatus === "declined" ){
            file.d_count += 1
        }
        else{
            file.p_count += 1
        }
        // key = `approval_${email}`;
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file);
    }

    // NEW ADD END-----------


    // FIND FILE
    async FindFile(ctx, key) {
        const fileJSON = await ctx.stub.getState(key);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The file with ${key} does not exist`);
        }
        return fileJSON.toString();
    }


    // FIND USER'S FILE USING EMAIL
    async FindUserFiles(ctx, email) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'file';
        queryString.selector.uploaderEmail = email;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // CHANGE FILE NAME
    async ChangeFileName(ctx, key, newName, newDownloadLink) {
        const fileJSON = await ctx.stub.getState(key);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The asset ${key} does not exist`);
        }
        let file = JSON.parse(fileJSON.toString());
        file.name = newName;
        file.downloadLink = newDownloadLink;
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file);
    }

    // DELETE FILE
    async DeleteFile(ctx, key) {
        const fileJSON = await ctx.stub.getState(key);
        if (!fileJSON || fileJSON.length === 0) {
            throw new Error(`The asset ${key} does not exist`);
        }
        await ctx.stub.deleteState(key);
        return JSON.stringify({ status: 'File Deleted' });
    }


    // SHARE FILE
    async ShareFile(ctx, key, fileKey, sharedWithEmail) {
        const fileShare = {
            key: key,
            fileKey: fileKey,
            sharedWithEmail: sharedWithEmail,
            docType: 'fileShare',
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(fileShare)));
        return JSON.stringify(fileShare);
    }

   
    // FIND SHARED FILE RETURN SINGLE FILE (death)
    async FindSharedFile(ctx, fileShareKey) {
        const fileShareJSON = await ctx.stub.getState(fileShareKey);
        if (!fileShareJSON || fileShareJSON.length === 0) {
            throw new Error(`The file with ${fileShareKey} does not exist`);
        }
        return fileShareJSON.toString();
    }

    // FIND SHARED FILE BY ME USING FILE KEY RETURN ARRAY
    async FindSharedFilesByFileKey(ctx, fileKey) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'fileShare';
        queryString.selector.fileKey = fileKey;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // 

    // FIND SHARED FILES, HOW MANY FILES USER SHARED WITH OTHER
    async FindSharedFilesWithUser(ctx, sharedWithEmail) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'fileShare';
        queryString.selector.sharedWithEmail = sharedWithEmail;
        return await this.GetQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // DELETE SHARED FILE
    async DeleteFileShare(ctx,key) {
        const fileShareJSON = await ctx.stub.getState(key);
        if (!fileShareJSON || fileShareJSON.length === 0) {
            throw new Error(`file share ${key} does not exist`);
        }
        await ctx.stub.deleteState(key);
        return JSON.stringify({
            status: 'FileShare Deleted'
        });
    }




    // HELPER FUNCTION

    async GetQueryResultForQueryString(ctx, queryString) {

        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        let results = await this.GetAllResults(resultsIterator, false);

        return JSON.stringify(results);
    }

    async GetAllResults(iterator, isHistory) {
        let allResults = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            res = await iterator.next();
        }
        iterator.close();
        return allResults;
    }

}

module.exports = AddLocker;
