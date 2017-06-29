
App42.initialize("f744328c432328e97317402595ccce3ea9c8a2f0911d4811ac2288c6bf334f5e",
				 "db5f25fb1d4b6043a749e253d632919942b5cf83baa931ed9301e012da8c0d80");

	function handleLogin(){
			var mail = $("#login-modal #mail").val();
			var mdp = $("#login-modal #pass").val();
			login(mail,mdp);
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
		element.lien =new Object();
		element.lien.url = $("#formAjout #lien").val();
		element.lien.site = $("#formAjout #site").val();
		element.lien.prix = $("#formAjout #prix").val();
		element.user = sessionStorage.getItem('pseudo');
		element.sessionId = sessionStorage.getItem('sessionId');
		addWish(element);
	}

	function handleReservation(){
		alert("todo");
	}
	function saveloggedUser(userjson){
			// get userName and sessionId from authenticate user response
				var userObj = JSON.parse(userjson);
				var name = userObj.app42.response.users.user.userName;
				var sId =  userObj.app42.response.users.user.sessionId;
				// save logged in user with sessionId to browser local storage.
				sessionStorage.setItem('pseudo', name);
				sessionStorage.setItem('sessionId', sId);
	}

	function login (mail,mdp){
		var userService  = new App42User();
		var otherMetaHeaders = {"emailAuth":"true"};
		userService.setOtherMetaHeaders(otherMetaHeaders);

		userService.authenticate(mail, mdp,{
			success: function(object) {
				console.log("connected", object);
				// get userName and sessionId from authenticate user response
				saveloggedUser(object);
				$("#login-modal").modal('hide');
				refreshWishes();
			},
			error: function(err) {
				// callback when user not found.
				console.log("connected error ",err);
			}
		});
	}
	function logout (sessionId){
		var sessionId = sessionStorage.getItem('sessionId');
		if(sessionId){
			var userService  = new App42User();
			userService.logout(sessionId,{
			    success: function(object)
			    {
			       $("#login-modal").modal('show');
			    },
			    error: function(error) {
			    }
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

	$("#login-register").click(function() {
		$("#login-modal").modal('hide');
		$("#register-modal").modal('show');
	});

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

			storageService.insertJSONDocument(dbName, collectionName, JSON.stringify(element),{
								success: function(object) {
									refreshWishes();
								},
								error: function(error) {
									$("#pleaseWaitDialog").modal('hide');
								}
			});
		}

	}

	function refreshWishes(){
		var session = sessionStorage.getItem('sessionId');
		if(session){
			$("#pleaseWaitDialog").modal('show');
			loadWishes().then(function(documents){
				var ul = $("#wishlist");
				ul.html("");
				$(documents).each(function(e){
					var element = renderListeElementHtml(this);
					ul.append(element);
				});
				$("#pleaseWaitDialog").modal('hide');
			});
		}else{
			$("#login-modal").modal('show');
		}
	}

	function renderListeElementHtml(element){

		var imagesrc = './images/gift.png'
		if(element.imageUrl){
			imagesrc = element.imageUrl;
		}
		var html='<div class="item col-xs-10 col-sm-6 col-md-4 ">'
			+'<div class="thumbnail">'
			+'<img src="'+imagesrc+'" alt="">'
			+'<div class="caption">'
			+'    <h3>'+element.objet+'</h3>'
			+'	  <p>'+element.description+'</p>';

			if(element.user){
				html += '<p class="small">Ajouté par : '+element.user+'</p>';
			}


			if(element.reservation){
				html +='<p class="small"> <img src="./images/check.png" class="img-rounded" alt="x" width="24" height="24"> ';
				html +=' Reservé par : '+element.reservation.user+'</p> </p>';
			}else{
				if(element.lien){
					html += '<p>Vu à '+element.lien.prix +'€ sur le site : <a href="'+element.lien.url+'">'+element.lien.site+'</a></p>';
				}
				html +='    <a href="#" class="btn btn-default" role="button">Offrir ce cadeau</a>'
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
