"use strict";

const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const {
  buildCAClient,
  registerAndEnrollUser,
  enrollAdmin,
} = require("../../test-application/javascript/CAUtil.js");
const {
  buildCCPOrg1,
  buildWallet,
} = require("../../test-application/javascript/AppUtil.js");

const channelName = "mychannel";
const chaincodeName = "addlocker1";
const mspOrg1 = "Org1MSP";
const walletPath = path.join(__dirname, "wallet");
const org1UserId = "appUser";

async function main() {
  try {
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPOrg1();

    const caClient = buildCAClient(
      FabricCAServices,
      ccp,
      "ca.org1.example.com"
    );

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    // in a real application this would be done on an administrative flow, and only once
    await enrollAdmin(caClient, wallet, mspOrg1);

    // in a real application this would be done only when a new user was required to be added
    // and would be part of an administrative flow
    await registerAndEnrollUser(
      caClient, wallet, mspOrg1, org1UserId,"org1.department1"
    );

    const gateway = new Gateway();

    try {
      await gateway.connect(ccp, {
        wallet, identity: org1UserId, discovery: { enabled: true, asLocalhost: true }, // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(channelName);

      // Get the contract from the network.
      const contract = network.getContract(chaincodeName);

      // Server side Code Here
      const express = require("express");
      const cookieParser = require("cookie-parser");
      const fileUpload = require("express-fileupload");
      const jwt = require("jsonwebtoken");
      const cors = require("cors");
      const path = require("path");
      const crypto = require("crypto");
      const fs = require("fs");
      const util = require("util");
      const bcrypt = require("bcryptjs");
      const dotenv = require("dotenv");
      const verify = require("./verifyToken")
      const app = express();
      const {
        registerValidation,
        loginValidation,
      } = require("./Uservalidation");

      const port = 3000;
      app.use(cookieParser());
      app.use(
        fileUpload({
          useTempFiles: true,
          tempFileDir: "tmp/",
          createParentPath: true,
          // preserveExtension:true
        })
      );
      app.use(express.urlencoded({ extended: false }));
      app.use(express.json());
      app.use(express.static("public"));

      dotenv.config();

      console.log;

      // ROUTE MIDDLEWARE

      app.post("/register", async (req, res) => {
        // console.log(req.body)
        const { email, password, c_password, role } = req.body;

        try {
          await contract.evaluateTransaction("FindUser", email);
          console.log(email, password, role);
          return res.json({ status: `User already exist ` });
        } catch (e) {
          const key = `user_${email}`;

          //lets validate the data before create user.
          if (password !== c_password) {
            return res.json({ error: "Password not match" });
          }
          const { error } = registerValidation(req.body);
          if (error)
            return res.status(400).json({ error: error.details[0].message });

          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(password, salt);
          console.log(hashPassword, email);
          await contract.submitTransaction(
            "CreateUser",key, email,hashPassword,role
          );
          res.json({ status: `user created successfully` });
        }
      });

      app.post("/login", async (req, res) => {
        try {
          const { email, password } = req.body;
          //lets validate the data before login
          const { error } = loginValidation(req.body);
          if (error)
            return res.status(400).json({ error: error.details[0].message });

          let result = await contract.evaluateTransaction("FindUser", email);
          let userData = JSON.parse(result.toString());
          const validPass = await bcrypt.compare(password, userData.password);
          console.log(password);
          console.log(userData.password);
          if (!validPass)
            return res.status(400).json({ error: "Invalid Password" });

          // CREATE AND ASSIGN A TOKEN
          const token = jwt.sign({ email: email }, process.env.TOKEN_SECRET, {
          expiresIn: "10h"
          })
         
          // console.log(result.toString());
          
          // console.log(res.cookies);
          let user = JSON.parse(result.toString());
          user.isLoggedIn = true;
          res.cookie("user", result.toString(), {
            maxAge: 3600_000,httpOnly: true,
          });
          res.cookie('token',token).json({ token: token })
          // res.json({ status: "Successfully logged in.." });
        } catch (e) {
          res.json({ status: `Email or password is wrong.` });
        }
      });

      app.get("/logout", async function (req, res) {
        try {
          res.cookie("user", "", { maxAge: -1, httpOnly: true });
          res.json({ status: "Successfully logout" });
        } catch (error) {
          res.status(400).json({ error: error.toString() });
        }
      });

      // helper function
      function UploadFile(action, path) {
        action.mv(path, function (err, resutl) {
          if (err) {
            throw err;
          }
        });
      }

      // CREATE INDIVIDUAL SIGNATORY
      app.post("/signatory/individual", async (req, res) => {
        const { photoIdCard, photo, signature } = req.files;
        const { firstName, lastName, member, abstract, other } = req.body;
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }

        if (photoIdCard === undefined || photo === undefined) {
          return res.status(400).send("You must upload a file...");
        }

        // UPLOAD PHOTOIDA CARD FILE
        const photoIdCardDest = path.join(
          __dirname,  "images",  "photo-id-card", photoIdCard.name
        );
        UploadFile(photoIdCard, photoIdCardDest);

        // UPLOAD PHOTO
        const photoDest = path.join(__dirname, "images", "photo", photo.name);
        UploadFile(photo, photoDest);

        // UPLOAD SINGNATURE
        const signatureDest = path.join(
          __dirname,"images","signature",signature.name
        );
        UploadFile(signature, signatureDest);
        // id, firstName, lastName, email, photoIdCard, photo, signature, member, abstract, other
        const user = JSON.parse(req.cookies.user.toString());
        if (user.role !== "individual") {
          return res.json({
            status: "You are not authorized to working here.",
          });
        }
        try {
          const id = `individual_${user.email}`;
          let result = await contract.submitTransaction(
            "CreateIndividualSignatory",
            id, firstName,lastName,user.email,photoIdCardDest,
            photoDest, signatureDest,member, abstract,other
          );
          return res.json({ status: JSON.parse(result.toString()) });
        } catch (error) {
          return res.status(400).json({ status: "Signatory not created." });
        }

        return res.json({ status: `file uploaded ` });
      });

      // CREATE Professional and Comapay SIGNATORY
      app.post("/signatory/proco", async (req, res) => {
        const { photoIdCard, photo, signature, stamp } = req.files;
        const { name, member, abstract, other } = req.body;
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }

        const user = JSON.parse(req.cookies.user.toString());
        console.log(user.role);
        if (user.role !== "proco") {
          return res.json({
            status: "You are not authorized to working here.",
          });
        }

        if (photoIdCard === undefined || photo === undefined) {
          return res.status(400).send("You must upload a file...");
        }

        // UPLOAD PHOTOIDA CARD FILE
        const photoIdCardDest = path.join(
          __dirname, "images", "photo-id-card",photoIdCard.name
        );
        UploadFile(photoIdCard, photoIdCardDest);

        // UPLOAD PHOTO
        const photoDest = path.join(__dirname, "images", "photo", photo.name);
        UploadFile(photo, photoDest);

        // UPLOAD SINGNATURE
        const signatureDest = path.join( __dirname,"images", "signature", signature.name
        );
        UploadFile(signature, signatureDest);

        // UPLOAD STAPM
        const stampDest = path.join(__dirname, "images", "stamp", stamp.name);
        UploadFile(stamp, stampDest);

        try {
          const id = `individual_${user.email}`;
          let result = await contract.submitTransaction(
            "CreateProCoSignatory", id, name,user.email,photoIdCardDest,signatureDest,
            member,stampDest,abstract,other
          );
          return res.json({ status: JSON.parse(result.toString()) });
        } catch (error) {
          return res.status(400).json({ status: "Signatory not created." });
        }
      });

      // CREATE DEPARTMENT

      app.post("/department", async (req, res) => {
        let { parentDept,childDept } = req.body;
        
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        let user = JSON.parse(req.cookies.user.toString())
        let key = `department_${user.email}_${parentDept}`;
        console.log(user,key)
        try {
          await contract.evaluateTransaction(
            "FindDepartment",key
          );
          return res.json({ status: `Department is already exist ` });
        } catch (e) {
          
          await contract.submitTransaction(
            "CreateDepartment", key,parentDept,childDept
          );
          res.json({ status: `Deparment created successfully` });
        }
      });
      
      // CREATE LOCKER ROOM
      app.post("/lockerroom", async (req, res) => {
        let { name,department } = req.body;
        name = name.toLowerCase();
        // console.log("Cookies", req.cookies.user);
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }

        try {
          let result = await contract.evaluateTransaction(
            "FindLockerRoom",name
          );
          console.log(result.toString());
          return res.json({ status: `LockerRoom is already exist ` });
        } catch (e) {
          let key = `locker_${name}`;
          const LockerRoomDest = path.join(__dirname, "Locker", "Room", name);
          let user = JSON.parse(req.cookies.user.toString())
          if (!fs.existsSync(LockerRoomDest)) {
            fs.mkdirSync(LockerRoomDest, { recursive: true });
          }
          await contract.submitTransaction(
            "CreateLockerRoom", key, LockerRoomDest,user.email,department
          );
          res.json({ status: `LockerRoom created successfully` });
        }
      });

      //helper function
      async function sha256(filePath) {
        const readFile = util.promisify(fs.readFile);
        const data = await readFile(filePath);
        const hash = crypto.createHash("sha256");
        hash.update(data);
        return hash.digest("base64");
      }

      //   CREATE FILE
      app.post("/createfile", async (req, res) => {
        const { lockerRoomName,member } = req.body;

        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }

        const uploadedFile = req.files?.uploadedFile;
        if (uploadedFile === undefined) {
          return res.status(400).send("You must upload a file...");
        }

        const fileName = uploadedFile.name;
        const fileDestination = path.join(
          __dirname, "Locker", "Room", lockerRoomName, fileName
        );
        const user = JSON.parse(req.cookies.user.toString());
        let uploaderEmail = user.email;
        const id = `file_${uploaderEmail}_${fileName}`;

        

        //  UPLOAD FILE
        uploadedFile.mv(fileDestination, async (error) => {
          if (error !== undefined) {
            return res
              .status(500).send(`Server error. Failed to move file ${error}...`);
          }
        });

        try {
        
          await contract.evaluateTransaction("FindFile", id);
          return res.json({ status: "This file already exists." });
        } catch (error) {
         
          const downloadLink = path.join(lockerRoomName, fileName);
          const fileHash = await sha256(fileDestination);
          const dateTime = new Date().toLocaleString();
          await contract.submitTransaction(
            "CreateFile",id, fileName,lockerRoomName, downloadLink, fileHash,
            uploaderEmail,dateTime
          );

          member.split(" ").map(async (shareWithEmail)=>{
            let fileKey = id
            let key = `fileShare_${shareWithEmail}_${fileKey}`
            try{
              if(shareWithEmail !== uploaderEmail){
                await contract.evaluateTransaction("FindUser", shareWithEmail);
                await contract.submitTransaction(
                'ShareFile', key, fileKey,shareWithEmail
              );
              res.json({status:`create and share successfully.`})
              }
            }catch(err){
              return res.json({status:`${shareWithEmail} is not exit`})
            }
           
          })
          
        
          return res.json({ status: "Create and share file successfully.." });
        }
      });

      // FIND USER'S ALL FILES
      app.get("/findUserFiles", verify,async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        console.log(req.user)
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction(
            "FindUserFiles",
            user.email
          );
          return res.json({ status: JSON.parse(result.toString()) });
        } catch (error) {
          return res.status(400).json({ status: "Users file not available." });
        }
      });

      // CHANGE FILE NAME
      app.put("/changefile/:fileId", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileId = req.params.fileId;
        try {
          // GET USER FROM COOKIES
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction("FindFile", fileId);

          const uploadedFile = JSON.parse(result.toString());
          const newFileName = req.body.newFileName;

          if (uploadedFile.uploaderEmail !== user.email) {
            return res
              .status(403).json({ status: "You are not authorized to update this file" });
          } else {
            //move file and update download link
            const renameFile = util.promisify(fs.rename);

            // FIND SOURCE DIRECTIORY
            const srcPath = path.join(
              __dirname, "Locker", "Room", uploadedFile.downloadLink
            );

            // RENAME THE FILE NAME AND MERGE WITH DIRECTORY
            const destinationPath = path.join(
              __dirname,"Locker", "Room",
              uploadedFile.lockerRoom, newFileName
            );

            // RENAME SOURCE DIR TO GOAL DIR
            const err = await renameFile(srcPath, destinationPath);

            // CREATE A DOWNLOADABLE LINK
            const newDownloadLink = path.join(
              uploadedFile.lockerRoom,newFileName
            );
            if (err !== undefined) {
              return res.status(500).send(`Server error ${err}`);
            }

            await contract.submitTransaction(
              "ChangeFileName",fileId,  newFileName, newDownloadLink
            );
            return res.json({ status: "Successfully changed file." });
          }
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });

      
      // SHARE FILE WITH EMAIL
      app.post("/fileshare", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const { fileKey, sharedWithEmail } = req.body;
        const key = `fileShare_${fileKey}_${sharedWithEmail}`;
        try {
          await contract.evaluateTransaction("FindSharedFile", key);
          res.json({ status: "File already shared with this user" });
        } catch (error) {
          await contract.submitTransaction(
            "ShareFile",key,fileKey, sharedWithEmail
          );
          res.json({
            status: `File Successfully shared with ${sharedWithEmail}`,
          });
        }
      });

      // APPROVAL REQUEST
      app.put("/fileshare/status/:fileKey", async function (req, res) {
        const {status} = req.body;
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileKey = req.params.fileKey;
        const user = JSON.parse(req.cookies.user.toString())
        const key = `fileShare_${user.email}_${fileKey}`;
        try {
          await contract.evaluateTransaction("FindSharedFile",key);
          // const statusKey = `status_${user.email}`
          // console.log("status key",statusKey)
          await contract.submitTransaction("ApprovalRequest",fileKey,status)
          res.json({ status: "Update file status successfully" });
        } catch (error) {
          res.json({status:"You are not authenticate for updating status."})
        }
      });


      // HOW MANY FILE SHARED WITH SPECIFIC USER
      app.post("/fileshare/withothers", async function (req, res) {
        let { email } = req.body;
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        let user = JSON.parse(req.cookies.user.toString());
        console.log(user);
        if (email === user.email) {
          return res.status(400).json({ status: "Please change email, it's you." });
        }
        try {
          let result = await contract.evaluateTransaction(
            "FindSharedFilesWithUser",email
          );
          return res.json({ status: JSON.parse(result.toString()) });
        } catch (error) {
          res.status(400).json({ status: "File not share succefully." });
        }
      });

      // FILE SHARED WITH ME
      app.get("/fileShare/withMe", async function (req, res) {
        // if (req.cookies.user === undefined) {
        //   return res.status(400).send("Your are not logged in..");
        // }
        try {
          const user = JSON.parse(req.cookies.user.toString());

          let result = await contract.evaluateTransaction(
            "FindSharedFilesWithUser",user.email
          );
          res.send(result.toString());
        } catch (error) {
          return res.status(400).send(error.toString());
        }
      });

      // FIND SHARED FILE WITH KEY WHICH I SHARED WITH OTHER
      app.get("/fileShare/byfile/:fileKey", async function (req, res) {
        if (req.cookies.user === undefined) {
          return res.status(400).send("Your are not logged in..");
        }
        const fileKey = req.params.fileKey;
        try {
          const user = JSON.parse(req.cookies.user.toString());
          let result = await contract.evaluateTransaction("FindFile", fileKey);
          const uploadedFile = JSON.parse(result.toString());
          if (uploadedFile.uploaderEmail !== user.email) {
            return res.status(403).send("You are not authorized to view this file");
          } else {
            let result = await contract.evaluateTransaction(
              "FindSharedFilesByFileKey", fileKey
            );
            return res.json({ status: JSON.parse(result.toString()) });
          }
        } catch (error) {
          return res.status(400).json({ status: error.toString() });
        }
      });

      

      app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
      });
    } finally {
      // gateway.disconnect();
    }
  } catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  }
}

main();
