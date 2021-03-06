﻿App42.initialize("ecfcacfd89d195f867ba21a60ff183c8428b1e7b3b876e6692218175b976c67d",
				 "71fa9c1fbc1cdef998f13284077596ef8fa6c7ba8f4d4d07541d38d0bafeff3d");
var dbName = "WISHLIST";
var collectionName = "collection";
var state = {
				wishes:[]
			};

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
			var mail = $("#register-modal #mail").val();
			var mdp = $("#register-modal #pass").val();
			var pseudo = $("#register-modal #pseudo").val();
			createUser(mail, mdp, pseudo);
	}
	function handleGotoRegister(){
		$("#login-modal").modal('hide');
		$("#register-modal").modal('show');

	}
	function handleGotoLogin(){
		$("#register-modal").modal('hide');
		$("#login-modal").modal('show');

	}
	function handleAjoutElement(){
		var element = {};
		// bidding
		element.imageUrl = $("#formAjout #imageUrl").val();
		element.objet=$("#formAjout #objet").val();
		element.description=$("#formAjout #description").val();
		element.lien = new Object();
		element.lien.url = $("#formAjout #lien").val();
		element.exemple = $("#formAjout #exemple").is(':checked');
		element.lien.site = $("#formAjout #site").val();
		element.lien.prix = $("#formAjout #prix").val();
		element.user = sessionStorage.getItem('pseudo');
		element.sessionId = sessionStorage.getItem('sessionId');
		addWish(element).then(function(){refreshWishes();});
	}
	function handleReservation(wishId){
		$("#pleaseWaitDialog").modal('show');
		addReservation(wishId).then(function(){
			
			refreshWishes();
			
		},function(erreur){
			alert("erreur lors de l'enregistrement de la reservation"+ erreur);
			$("#pleaseWaitDialog").modal('hide');

		});
	}
	function handleAnnulerReservation(wishId){
		$("#pleaseWaitDialog").modal('show');
		removeReservation(wishId).then(function(){
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
				state.wishes = documents;
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
			return new Promise( function(resolve, reject) {
				var jsonDoc = JSON.stringify(element);
				storageService.insertJSONDocument(dbName, collectionName, jsonDoc ,{
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
		
		var promises = [];
		var session = sessionStorage.getItem('sessionId');
		
		var reservation = new Object();
		reservation.user = sessionStorage.getItem('pseudo');
		reservation.contact = sessionStorage.getItem('email');
		reservation.userId = session;
						
		var currentWish = state.wishes.find(function(element){return wishId === element._id.$oid;});
		
		if(currentWish && currentWish.multiple === true){
			console.log("Reservation d'un wish mulitple");
			var newWish = dupliquerWish(currentWish);
			newWish.reservation = reservation;
			//ajout du voeux dupliqué avec la reservation
			var promiseDuplication = new Promise( function(resolve, reject) {
					addWish(newWish).then(function(){
						alert("Cadeau Multiple : La reservation de cet élément a été enregistré sur une nouvelle vignette");
						resolve();	
					},function(erreur){
						reject("huhu la reservation multiple n'a pas marché. Merci d'essayer avec un navigateur plus récent(chrome).");
					});
			});		
			
			promises.push(promiseDuplication);
			
		}else{			
			console.log("Reservation d'un wish classique");
			var promiseReservation = new Promise( function(resolve, reject) {
				var storageService  = new App42Storage();	
				var keys = new Object();
				keys.reservation = reservation;
				storageService.addOrUpdateKeys(dbName, collectionName, wishId, keys,
				{
					success: function(object) {
						console.log("ok");
						resolve();
					},
					error: function(error) {
						reject("huhu la reservation n'a pas marché. Merci d'essayer avec un navigateur plus récent(chrome).");
					}
			
				});				
			});
			promises.push(promiseReservation);
			
		}
		return Promise.all(promises);
	}

	function removeReservation(wishId){

		return new Promise( function(resolve, reject) {
			var storageService  = new App42Storage();
			var keys = new Object();
			keys.reservation = {};
			storageService.addOrUpdateKeys(dbName, collectionName, wishId, keys,
			{
				success: function(object) {
					console.log("ok");
					resolve();
				},
				error: function(error) {
					reject("Erreur lors de la mise à jour");
				}
			});

		});
	}
	
	function getWish(wishid){
		var storageService  = new App42Storage();
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
	
	function dupliquerWish(wishADupliquer){
		var wish = Object.assign({}, wishADupliquer);
		wish._id = undefined;
		return wish;
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


		var html='<div class="item col-xs-10 col-sm-6 col-md-4 ">'
							+'	<div class="thumbnail">';

		html += renderImage(element);

		html += '				<div class="caption">';

			html += renderObjetDescription(element);
			var isReservationActif = (element.reservation && element.reservation.user);

			// rendu Lien vers site
			html += renderLien(element.lien, !isReservationActif);
 			html += renderBoutonReservation(element);
			html += renderUser(element.user);



			html+='			</div>'
				  +'	</div>'
					+"</div>";
		return html;
	}

	function renderObjetDescription(element){
		var html="";
		// Libellé type par default
		var type = 'Article souhaité :';
		
		if(element.exemple === true){
			type= "Exemple d'article :";
		}
		if(element.multiple === true){
			type= "Article Multiple :";
		}

		html += '   <h3>'+element.objet+'</h3>';
		html += '	  <p>'+type+'</p>';
		html +='	  <p>'+element.description+'</p>';

		return html;
	}

	function renderBoutonReservation(element){
		var html = "";

		var isReservationActif = (element.reservation && element.reservation.user);

		if(isReservationActif){
					// Bouton reservation
					html +='<p class="small"> <img src="./images/check.png" class="img-rounded" alt="x" width="24" height="24"> ';
					html +=' Reservé par : '+element.reservation.user+'</p> </p>';

					if(sessionStorage.getItem('email') === element.reservation.contact && !element.multiple===true){
						html +='<a href="#" class="btn btn-default" role="button" onClick='
							+ "'" + 'handleAnnulerReservation("'+element._id.$oid+'");'+ "'>Annuler</a>";
					}
		}else{
			var libelleBouton ='Offrir ce cadeau';
			if(element.multiple === true){
				libelleBouton= " +1";
			}
				// Bouton Ajout
				html +='<a href="#" class="btn btn-default" role="button" onClick='
				+ "'"
				+ 'handleReservation("'+element._id.$oid+'");'
				+ "'>"+libelleBouton+"</a>";
		}


		return html;
	}

	function renderLien(lien, afficherPrix){
		var html = "";
		//Lien URL
		if(lien && lien.url){
			//nom site par default
			if(!lien.site){
				lien.site = "site";
			}

			html += '<p>Vu ';
			if(afficherPrix && lien.prix){
				html += 'à '+lien.prix +'€ ';
			}
			html += 'sur le site : <a href="'+ lien.url+'">'+ lien.site +'</a></p>';
		}

		return html;
	}

	function renderImage(element){
		var html = "";
		//image par default
		var imagesrc = './images/gift.png';
		if(element.imageUrl){
			imagesrc = element.imageUrl;
		}

		html+='<img src="'+imagesrc+'" alt="">';

		return html;
	}

	function renderUser(user){
	var html = "";
	if(user){
		html += '<div><p class="small">Ajouté par : '+ user +'</p></div>';
	}
	return html;
}

	//on ready
	$( document ).ready(function() {
		refreshWishes();

	});
