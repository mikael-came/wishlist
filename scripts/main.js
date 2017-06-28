
App42.initialize("f744328c432328e97317402595ccce3ea9c8a2f0911d4811ac2288c6bf334f5e",
				 "db5f25fb1d4b6043a749e253d632919942b5cf83baa931ed9301e012da8c0d80");

	var handleLogin = function(){
			var usr = $("#login-modal #pseudo").val();
			var mdp = $("#login-modal #pass").val();
			login(usr,mdp);
			return false; // prevent further bubbling of event
	}
	var handleRegister = function(){
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
		element.imageUrl = "http://static.kiabi.com/images/lot-7-bavoirs-eponge-blancbleugris-bebe-garcon-fn517_1_zc1.jpg";
		element.objet="objet";
		element.description="description";
		element.lien ={};
		element.lien.url = "http://www.kiabi.com/lot-7-bavoirs-eponge-bebe-garcon_P343440C343439#&ns_mchannel=sem&ns_source=google&ns_campaign=pla&utm_medium=sem&utm_source=google&utm_campaign=pla";
		element.lien.site ="Kiabi.com";
		element.lien.prix = 10;
		addWish(element);
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
	function login (usr,mdp){
		var user  = new App42User();
		user.authenticate(usr, mdp,{
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
		var session = sessionStorage.getItem('sessionId');
		if(session){
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
		$("#pleaseWaitDialog").modal('show');
		loadWishes().then(function(documents){
			var ul = $("#wishlist");
			ul.html("");
			$(documents).each(function(e){
				var element = makeListeElementHtml(this);
				ul.append(element);
			});
			$("#pleaseWaitDialog").modal('hide');
		});
	
	}
	
	function makeListeElementHtml(element){
	
		var imagesrc = './images/gift.png'
		if(element.imageUrl){
			imagesrc = element.imageUrl;
		}
		var html='<div class="item col-xs-12  col-sm-6 col-md-4 ">'
			+'<div class="thumbnail">'
			+'<img src="'+imagesrc+'" alt="">'
			+'<div class="caption">'
			+'    <h3>'+element.objet+'</h3>'
			+'	  <p>'+element.description+'</p>';
			if(element.lien){
				html += '	  <p>Vu � '+element.lien.prix +'Euros chez <a href="'+element.lien.url+'">'+element.lien.site+'</a></p>'
			}
			html +='    <a href="#" class="btn btn-default" role="button">Offrir ce cadeau</a>'
			+'</div>'
		    +'</div>'
			+"</div>";
		return html;
		//return '<li  class="list-group-item">'+element.objet+"</li>";
	}
	
	//on ready	
	$( document ).ready(function() {
		refreshWishes();
	});
	
	
	