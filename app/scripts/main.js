
App42.initialize("f744328c432328e97317402595ccce3ea9c8a2f0911d4811ac2288c6bf334f5e",
				 "db5f25fb1d4b6043a749e253d632919942b5cf83baa931ed9301e012da8c0d80");

	function handleLogin(){
			var mail = $("#login-modal #mail").val();
			var mdp = $("#login-modal #pass").val();
			login(mail,mdp).then(function(){
				$("#login-modal").modal('hide');
				refreshWishes();
			},function(error){
				alert("Erreur de connexion."+error);
			});
			return false; // prevent further bubbling of event
	}
	function handleRegister(){
			var mail = $("#register-modal #pseudo").val();
			var mdp = $("#register-modal #pass").val();
			var pseudo = $("#register-modal #pseudo").val();
			createUser(mail, pseudo, mdp);
	}
	function handleGotoRegister(){
		$("#login-modal").modal('hide');
		$("#register-modal").modal('show');

	}
	function handleAjoutElement(){
		var element = {};
		// bidding
		element.imageUrl = $("#formAjout #imageUrl").val();
		element.objet=$("#formAjout #objet").val();
		element.description=$("#formAjout #description").val();
		element.lien = new Object();
		element.lien.url = $("#formAjout #lien").val();
		element.lien.site = $("#formAjout #site").val();
		element.lien.prix = $("#formAjout #prix").val();
		element.user = sessionStorage.getItem('pseudo');
		element.sessionId = sessionStorage.getItem('sessionId');
		addWish(element).then(function(){refreshWishes();});
	}
	function handleReservation(wishId){
		$("#pleaseWaitDialog").modal('show');
		addReservation(wishId).then(function(){			
			alert("Merci de votre participation.", "Mike et Elo");
			$("#pleaseWaitDialog").modal('hide');
			refreshWishes();
			
		},function(erreur){
			alert("erreur lors de l'enregistrement de la reservation"+ erreur);
			$("#pleaseWaitDialog").modal('hide');

		});
	}
	
	function handleLogout(){
		logout().then(function(){
			refreshWishes();
			$("#login-modal").modal('show');
		},function(erreur) {
			refreshWishes();
			$("#login-modal").modal('show');
			refreshWishes();
		});
	}

	function refreshWishes(){
		var session = sessionStorage.getItem('sessionId');
		if(session){
			$("#pleaseWaitDialog").modal('show');
			loadWishes().then(function(documents){
				renderListeWishes(documents);
				$("#pleaseWaitDialog").modal('hide');
			},
			function(error){
				$("#pleaseWaitDialog").modal('hide');
				alert("Une erreur de chargement à eu lieu.");
				
			});
		}else{
			$("#login-modal").modal('show');
		}
	}
	
	function saveloggedUser(userjson){
			// get userName and sessionId from authenticate user response
				var userObj = JSON.parse(userjson);
				var name = userObj.app42.response.users.user.userName;
				var sId =  userObj.app42.response.users.user.sessionId;
				var email =  userObj.app42.response.users.user.email;
				// save logged in user with sessionId to browser local storage.
				sessionStorage.setItem('pseudo', name);
				sessionStorage.setItem('sessionId', sId);
				sessionStorage.setItem('email', email);
				
	}

	$("#login-register").click(function() {
		$("#login-modal").modal('hide');
		$("#register-modal").modal('show');
	});


	//---Services---------------------------------------------
	function login (mail,mdp){
		var userService  = new App42User();
		var otherMetaHeaders = {"emailAuth":"true"};
		userService.setOtherMetaHeaders(otherMetaHeaders);
		return new Promise( function(resolve, reject) {
			userService.authenticate(mail, mdp,{
				success: function(object) {
					console.log("connected", object);
					saveloggedUser(object);
					resolve();
					
				},
				error: function(err) {
					// callback when user not found.
					console.log("connected error ",err);
					reject(JSON.parse(err).app42Fault.details);
				}
			});
		});
	}
	
	function logout(){
		var sessionId = sessionStorage.getItem('sessionId');
		if(sessionId){
			var userService  = new App42User();
			
			return new Promise( function(resolve, reject) {
				userService.logout(sessionId,{
					success: function()
					{
					   console.log("logout success");
					   sessionStorage.removeItem('sessionId');					  
					   resolve();
					},
					error: function(error) {
						sessionStorage.removeItem('sessionId');
						console.log("logout error",error);
						reject(error);
					}
				});
			});
		}
	};

	function createUser(mail, mdp, pseudo){
			var user  = new App42User();
			user.createUser(pseudo, mdp, mail,{
				success: function(object) {
					saveloggedUser(object);
					$("#register-modal").modal('hide');
					refreshWishes();
				},
				error: function(error) {
					console.log(error);
				}
			});
	}

	function loadWishes(){
		var storageService  = new App42Storage();
		var dbName = "WISHLIST";
		var collectionName = "collection";
		return new Promise( function(resolve, reject) {
				storageService.findAllDocuments(dbName, collectionName,{
									success: function(object) {
										var storageObj = JSON.parse(object);
										var documents = storageObj.app42.response.storage.jsonDoc;
										resolve(documents);
									},
									error: function(error) {
										reject(error);
									}
				});
		});
	}

	function addWish(element){
		var session = sessionStorage.getItem('sessionId');
		if(session){
			$("#pleaseWaitDialog").modal('show');
			var storageService  = new App42Storage();
			var dbName = "WISHLIST";
			var collectionName = "collection";
			return new Promise( function(resolve, reject) {
				var jsonDoc = {data :JSON.stringify(element) };
				storageService.insertJSONDocument(dbName, collectionName,jsonDoc ,{
									success: function(object) {
										resolve();										
									},
									error: function(error) {
										$("#pleaseWaitDialog").modal('hide');
									}
				});
			});
		}

	}
	function addReservation(wishId){
		var session = sessionStorage.getItem('sessionId');
		if(session){
			return new Promise( function(resolve, reject) {
				var storageService  = new App42Storage();
				var dbName = "WISHLIST";
				var collectionName = "collection";
				//recuperation du wish 
				//getWish(wishId).then(function(wishDocument){
					//le wish existe bien :)
					//if(wishDocument.data.reservation == undefined){
						//ajout resa au document
						var reservation = new Object();
						reservation.user = sessionStorage.getItem('pseudo');
						reservation.contact = sessionStorage.getItem('email');
						reservation.userId = session;
						
						var key = new Object();
						key.name="reservation_user";
						key.type=reservation.user;
						//var docId =wishDocument._id.$oid;
						var newstorageService  = new App42Storage();  
						newstorageService.addOrUpdateKeys(dbName,collectionName,wishId, key,
						{
							success: function(object) {
								console.log("ok");
								resolve();										
							},
							error: function(error) {
								reject("Erreur lors de la mise à jour");
							}
						});
					//}
					//else{
					//	reject("l'élement est déjà réservé");
					//}
					
					
				//},function(error){
					//reject("erreur lors de l'ajout de la resa :"+error);
				//});
			});
		}
	}
	
	function getWish(wishid){
		var storageService  = new App42Storage();
		var dbName = "WISHLIST";
		var collectionName = "collection";
		return new Promise( function(resolve, reject) {
			storageService.findDocumentById(dbName, collectionName, wishid,{    
				success: function(object)   
				{    
					var jsonDoc = JSON.parse(object).app42.response.storage.jsonDoc;
					resolve(jsonDoc);
				},    
				error: function(error) {    
					reject(error);
				}
			});
		});
	}

	//---renderer Component ---------------------------------
	function renderListeWishes(liste){
		var ul = $("#wishlist");
		//clean
		ul.html("");
		//render
		$(liste).each(function(e){
			var element = renderElementHtml(this);
			ul.append(element);
		});
	}
	function renderElementHtml(element){
		var data = element.data;
		var imagesrc = './images/gift.png'
		if(data.imageUrl){
			imagesrc = data.imageUrl;
		}
		var html='<div class="item col-xs-10 col-sm-6 col-md-4 ">'
			+'<div class="thumbnail">'
			+'<img src="'+imagesrc+'" alt="">'
			+'<div class="caption">'
			+'    <h3>'+data.objet+'</h3>'
			+'	  <p>'+data.description+'</p>';

			if(data.user){
				html += '<p class="small">Ajouté par : '+data.user+'</p>';
			}


			if(data.reservation){
				html +='<p class="small"> <img src="./images/check.png" class="img-rounded" alt="x" width="24" height="24"> ';
				html +=' Reservé par : '+data.reservation.user+'</p> </p>';
			}else{
				if(data.lien){
					html += '<p>Vu à '+data.lien.prix +'€ sur le site : <a href="'+data.lien.url+'">'+data.lien.site+'</a></p>';
				}
				html +='<a href="#" class="btn btn-default" role="button" onClick='
					+ "'"
					+ 'handleReservation("'+element._id.$oid+'");'
					+ "'>Offrir ce cadeau</a>"
			}

			+'</div>'
		    +'</div>'
			+"</div>";
		return html;
	}

	//on ready
	$( document ).ready(function() {
		refreshWishes();

	});
