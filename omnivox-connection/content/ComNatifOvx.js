//SVP, faire en sorte que le fichier ComNatifOvx.js dans Mobile (D:\Omnivox\Web\WebRootMobile\Views\Commun\Javascript\Application\ComNatifOvx.js)
//	et Intraflex (D:\Omnivox\Web\WebRootIntraflex\Module\Identification\Login\Mobile\JavaScript\ComNatifOvx.js) soient identique en tout temps

(function () {
	//Functions qui gèrent la communication avec l'app native
	//	Se fier à Ovx.Storage.SetCodeUserAgent pour faire la technique de callback.
	window.Ovx = {};

	window.Ovx.IOS = {};
	window.Ovx.Android = {};

	var PREFIXE_REQUETE = "ovx://";

	// Pour débugger dans chrome au bureau
	// Disable les commandes natives lors des unit tests aussi
	var isDebug = (navigator.userAgent.toLowerCase().indexOf("debug") !== -1 && navigator.platform === "Win32") || window.unitTest;
	var iOS = /iphone|ipad|ipod/gi.test(navigator.appVersion) || /iphone|ipad|ipod/gi.test(navigator.userAgent);
	var android = /Android/gi.test(navigator.userAgent);
	var isAppJs = function () {
		return window.Skytech && Skytech.Commun && Skytech.Commun.Utils;
	};

	/** Indique si le LogWorker est disponible, si oui on l'utilise pour les errors, sinon on va throw l'error au lieu de planté sur un undefined du LogWorker */
	var hasLogWorker = function () {
		return isAppJs() && Skytech.Commun.Application && Skytech.Commun.Application.LogWorker;
	}

	// === Application ===
	window.Ovx.Application = {};

	Ovx.Application.IsDebug = function () {
		/*
		*	Permet de savoir si on est en debug
		*/
		return isDebug;
	};


	Ovx.Application.OnBecomeActive = function (arrInfo) {
		/*
		*	À l'ouverture de l'application, cette méthode sera appelée par l'app iOS dans l'événement applicationDidBecomeActive
		*
		*   Array : arrInfo, contient des informations sur le lancement de l'application (vide pour le moment).
		*/
		if (typeof Skytech === 'object'
			&& typeof Skytech.Commun === 'object'
			&& typeof Skytech.Commun.Application === 'object'
			&& typeof Skytech.Commun.Application.HeartbeatWorker === 'object'
			&& typeof Skytech.Commun.Application.HeartbeatWorker.Heartbeat === 'function') {

			Skytech.Commun.Application.HeartbeatWorker.Heartbeat();
		}
	};

	createCommand({
		Name: 'Application.DeviceStats',
		ShouldExecute: function () {
			return Skytech.Commun.Utils.Support.IsMinimumVersion('3.0.2', '3.0.2');
		}
	});

    /*
    * Callback pour une demande d'ouverture de page.
    * Doit être seulement utilisé par l'app js.
    */
	var _openMioPageCallback;
	Ovx.Application.SetOpenMioPageCallback = function (callback) {
	    _openMioPageCallback = callback;
	};

	Ovx.Application.OpenMioPageCallBack = function (arrInfo) {
	    if (typeof _openMioPageCallback === 'function') {
	        _openMioPageCallback(arrInfo);
	    }
	};

    /*
    * Demande à la webview parent/contenant l'app js d'ouvrir une page de Mio.
    * Doit être seulement appelée par la webview secondaire/externe.
    * string page: Indique vers quelle page naviguer, vaut 'inbox', 'sent', 'compose'.
    * string destinataire: Pour la page 'compose', un objet JSON en string qui indique à qui envoyer le message.
    * L'objet est identique à celui dans Views\Commun\Javascript\UI\Utils.js dans la fonction Skytech.Commun.UI.Utils.EnvoyerMio.
    */
	Ovx.Application.OpenMioPage = function (page, destinataire) {
	    ExecuteCommand('Application.OpenMioPage', { 'Page': page, 'Destinataire': destinataire });
	};

    /*
    * Callback pour obtenir l'url d'autologin de Léa.
    * Côté app native, le callback est appelée quand une webview secondaire veut avoir l'url d'autologin
    * et coté webview secondaire, le callback contient le résultat.
    */
	var _getLeaAutoLoginUrlCallback;
	Ovx.Application.SetGetLeaAutoLoginUrlCallback = function (callback) {
	    _getLeaAutoLoginUrlCallback = callback;
	};

	Ovx.Application.GetLeaAutoLoginUrlCallBack = function (arrInfo) {
	    if (typeof _getLeaAutoLoginUrlCallback === 'function') {
	        _getLeaAutoLoginUrlCallback(arrInfo);
	    }
	};

    /*
    * Demande à la webview parent/contenant l'app js l'url d'autologin.
    * Du côté de l'app js, sert à renvoyer l'URL d'autologin à la
    * la webview enfant.
    */
	Ovx.Application.GetLeaAutoLoginUrl = function (url) {
	    ExecuteCommand('Application.GetLeaAutoLoginUrl', { 'Url': url });
	};

	var callbackUrlProtocol = null;
	Ovx.Application.SetUrlProtocolReceiveCallBack = function (callback) {
	    callbackUrlProtocol = callback;
	};

	Ovx.Application.UrlProtocolReceiveCallBack = function (obj) {

	    if (callbackUrlProtocol === null) {
	        return;
	    }

	    callbackUrlProtocol(obj);
	};

	// === WebUI ===
	/*
	* Permets d'afficher une page web dans une nouvelle fenêtre de navigation.
	*
	* String : Url, adresse de la page à accéder encodée au format URLEncode.
	* String : DisplayTitleBar, True | False, permet d'afficher ou cacher la barre de titre
	* String : DisplayNavigationBar, True | False, permet d'afficher ou cacher la barre de navigation
    * String : DisplayNavigationBar, True | False, permet d'afficher ou cacher la barre de navigation alternative (pour les modules responsive)
	* String : UseWebKit, True | False, pour iOS, utilise la WKWebview au lieu de UIWebView, ignoré sur Android et les versions d'iOS inférieures à 8.
	* String : ActionButtonOptions, Print |Safari | OpenIn , indique les options à activer lorsque l'utilisateur utilise le bouton action. Dans le cas où aucune option n'est active, le bouton n'est pas affiché.
	* String : TextBtnBack, texte du lien retour à affiché à l'utilisateur
    * String : TextBackAltNavbar, le texte sur le label back de la barre de navigation alternative.
	* Function : closedCallback, Callback quand la fenêtre qui a été ouverte se ferme.
	*/
	createCommand({
		Name: 'WebUI.OpenNewWindow',
		GetParams: function (url, displayNavigationBar, displayAltNavigationBar, displayToolbar, useWebKit, useExistingView, actionButtonOptions, textBtnBack, textBackAltNavbar, closedCallback) {
			return {
				Args: {
					  Url: url
					, DisplayNavigationBar: (displayNavigationBar ? "True" : "False")
                    , DisplayAltNavigationBar: (displayAltNavigationBar ? "true" : "false")
					, DisplayToolbar: (displayToolbar ? "True" : "False")
					, UseWebKit: (useWebKit ? "true" : "false")
                    , UseExistingView: (useExistingView ? "true" : "false")
					, ActionButtonOptions: actionButtonOptions
					, TextBtnBack: textBtnBack
                    , TextBackAltNavbar: textBackAltNavbar
				},
				Callback: closedCallback
			};
		}
	});

	var isClosingWindow = false;
	/*
	* Optionnel Bool : CloseAll, [True | False] indique à l'App iOS
	*/
	createCommand({
		Name: 'WebUI.CloseWindow',
		GetParams: function (closeAll, callback, paramsCallback) {
			return {
				Args: {
					CloseAll: (closeAll ? "True" : "False"),
					ParamsCallback: paramsCallback
				},
				Callback: callback
			};
		},
		ShouldExecute: function () {
			//Je rajoute un isClosingWindow car selon SKeX si on appel WebUI.CloseWindow trop de fois en même temps asynchrone ca pourrais vraiment briser
			//	l'app native
			if (isClosingWindow) {
				return false;
			}
			isClosingWindow = true;
			return true;
		},
		OnCallback: function(callback, data) {
			if (callback) {
				var hasClosedWindow = typeof data.HasClosedWindow !== "undefined"
										&& data.HasClosedWindow.toLowerCase() == "true";
				callback(hasClosedWindow);
			}
			isClosingWindow = false;
		}
	});

	/*
	* À l'ouverture de l'application, cette page sera directement accédée.
	*
	* String : Url, adresse de la page par défaut encodée au format URLEncode.
	*/
	createCommand({
		Name: 'WebUI.SetDefaultPage',
		GetParams: function (url) {
			return {
				Args: {
					"Url": url
				},
				Callback: null
			};
		}
	});

	/*
	* Permets de contrôle l'affichage de la barre d'entête et de navigation de la fenêtre courante. S'applique à la fenêtre primaire et à la fenêtre secondaire.
	*
	* String : DisplayNavigationBar, True | False, permet d'afficher ou cacher la barre de titre
	* String : DisplayToolbar, True | False, permet d'afficher ou cacher la barre de navigation
	* String : ActionButtonOptions, Print |Safari | OpenIn , indique les options à activer lorsque l'utilisateur utilise le bouton action. Dans le cas où aucune option n'est active, le bouton n'est pas affiché.
	* String : TextBtnBack, texte du lien retour à affiché à l'utilisateur
	*/
	createCommand({
		Name: 'WebUI.SetWindowOption',
		GetParams: function (displayNavigationBar, displayToolbar, displayActionButton, textBtnBack) {
			return {
				Args: {
					DisplayNavigationBar: (displayNavigationBar ? "True" : "False")
					, DisplayToolbar: (displayToolbar ? "True" : "False")
					, DisplayActionButton: displayActionButton
					, TextBtnBack: textBtnBack
				}
			};
		}
	});

	/*
	* Permets de réinitialiser les informations stockées sur l'App iOS.
	*/
	Ovx.WebUI.ResetSession = function (key, value) {
		if (isAppJs())
			addLogDebugCodeUA("ResetSession");

		ExecuteCommand("WebUI.ResetSession", {});
	};
	Ovx.WebUI.ResetSessionCallBack = function (arrInfo) {
	};

	/*
	* Ferme l'application en appelant la méthode Exit(0).
	*/
	createCommand({ Name: 'WebUI.Exit' });

	/*
	* Redémare l'application
	*/
	createCommand({ Name: 'WebUI.Restart' });

	var _isAppOnline = window.isOnline;
	Ovx.WebUI.IsAppOnline = function () {
		if (typeof _isAppOnline !== "undefined") {
			return _isAppOnline;
		} else {
			return navigator.onLine;
		}
	};

	var isOnlineCallback = null;

	Ovx.WebUI.IsOnline = function (callback) {
		/*
		* Indique l'état online/offline dans le callback Ovx.WebUI.IsOnlineCallBack.
		* Suite à l'appel de WebUI.IsOnline, appeler le callback à chaque fois que l'état en online/offline change.
		*/
		isOnlineCallback = callback;
		var arrParametres = {};
		ExecuteCommand("WebUI.IsOnline", arrParametres);
	};
	Ovx.WebUI.IsOnlineCallBack = function (arrInfo) {
		/*
		* Valeurs retournées par le dictionnaire arrInfo :
		* string : IsOnline, True | False, indique si l'appareil est en ligne.
		*/
		if (typeof arrInfo.IsOnline !== "undefined") {
			_isAppOnline = arrInfo.IsOnline === "True";
			if (typeof isOnlineCallback === "function") {
				isOnlineCallback(_isAppOnline);
			}
		}
	};

	Ovx.WebUI.OpenURLInDeviceBrowser = function (url) {

		// TODO: Faire une commande dédiée pour ça, ne pas piggy-back sur d'autres commandes.

		if (iOS) {
			ExecuteCommand("WebUI.NavigateToStore", {
					urlStore: url
				},
				/* useContextSensitiveEncoding: */ true);
		} else {
			ExecuteCommand('Android.OpenFile', { 'Url': url, 'ContentType': null });
		}

	};

	Ovx.WebUI.NavigateToStore = function (query) {
		/*
		* Permet de naviguer vers l'Apple App Store ou le Google Play Store
		*
		* Puisque sous Android 4.4+, il est impossible d'utiliser le protocol market://
		* pour naviguer vers le Play Store, on va utiliser une commande native qui va créer
		* une activité avec le Google Play Store comme intent.
		*
		* query: Si une query est spécifié on va faire un search sur android ou amener a l'acceuil du store sur ios.
		*        Si il n'y a pas de query on va sur la page de l'app directement.
		*/

		query = typeof query === "string" ? query : null;

		if (iOS) {
			var urlStore;
			if (!query) {
				urlStore = "https://itunes.apple.com/ca/app/omnivox-mobile/id721913649?mt=8&uo=4";
			} else {
				urlStore = "https://itunes.apple.com/ca/genre/ios/id36?mt=8";
			}

			if (Skytech.Commun.Utils.Support.IsMinimumVersion('3.9.0', null)) {

				// La WKWebView ne supporte pas les deep links de la même façon que la UIWebView.
				// Donc pour juste faire en sorte que ce lien exact ouvre le App Store (et aucun autre lien), on va passer par une commande comme sur Android.
				ExecuteCommand("WebUI.NavigateToStore", {
						query: query,
						urlStore: urlStore
					},
					/* useContextSensitiveEncoding: */ true);
			} else {
				window.location = urlStore;
			}
		}
		else if (android) {
			var arrParametres = {
				query: query
			};
			ExecuteCommand("WebUI.NavigateToStore", arrParametres);
		}
	};

	/*
	* Permet de setter les options de la barre de navigation alternative (la petite barre rouge).
	* String: Show						True|False	: Permet d'afficher ou de cacher la barre.
	* String: BackButtonText			String		: Texte qui sera affiché dans le bouton retour.
	* String: BackButtonURL				String		: URL vers laquelle on navigue en cliquant sur le bouton retour.
	* String: ShouldHideOnReturn		True|False	: Permet de cacher la barre quand on clique sur le bouton retour.
	*/
	Ovx.WebUI.SetAltNavigationBarOptions = function (options) {
		options = options || {};
		ExecuteCommand("WebUI.SetAltNavigationBarOptions", options, true);
	};

	Ovx.WebUI.Omnigarder = function (arrInfo) {
		/*
		* Permet à l'app native d'envoyer un Omnigarde en cas d'erreur non-gérée dans le code Java ou Obj-C.
		*/

		// [F27339] - 2014-09-17 - Marc LeBlanc
		// J'imagine que c'est assez pour lancer l'Omnigarde. On pourra le tester une fois codé du côté natif.
		if (hasLogWorker()) // On fera rien si on n'a pas le LogWorker...
			Skytech.Commun.Application.LogWorker.LogError(arrInfo.CodeOmnigarde, arrInfo.DescriptionOmnigarde);
	};

	var _memoryWarningCallback = null;
	Ovx.WebUI.OnMemoryWarning = function (callback) {
		/**
		 * Fonction qui va être applé quand l'app reçoit un avertissement qu'elle prend trop de mémoire.
		 * Permet de libérer des ressources pour éviter qu'elle se fasse kill.
		 */
		_memoryWarningCallback = callback;
	};

	Ovx.WebUI.OnMemoryWarningCallBack = function () {
		if (_memoryWarningCallback) {
			_memoryWarningCallback.call(null);
		}
	};

	var callbackOnResize = null;

	Ovx.WebUI.OnResize = function (callback) {
		/**
		 * Appelé quand l'app doit recalculer ses dimensions.
		 */
		callbackOnResize = callback;
	};

	Ovx.WebUI.OnResizeCallBack = function () {
		if (callbackOnResize) {
			callbackOnResize.call(null);
		}
	};

	Ovx.WebUI.OnWillEnterBackgroundCallBack = function () {
		/**
		 * Appelé quand l'app reprend le focus lors que l'utilisateur reviens sur l'app (qu'elle étais en background/hidden)
		 */

		sendAnalytics(); //[F40673] 2020-05-04, Pierre-Luc Lemire: Si il y a des stats à envoyé, ce sera fait ici.
	};

	// === Storage ===
	window.Ovx.Storage = {};

	var arrObjCallbacksSetCodeUserAgent = [];

	Ovx.Storage.SetCodeUserAgent = function (code, callback, args) {
		/*
		* Sauvegarde le code d'authentification à acheminer à chaque requête web.
		*
		* String : Code, code d'authentification sauvegarder.
		*/
		var callbackCourant = {};
		callbackCourant.Callback = callback;
		callbackCourant.Arguments = args;

		var arrParametres = {
			"Code": code
		};

		ExecuteCommand("Storage.SetCodeUserAgent", arrParametres);

		if (!isDebug) {
			callbackCourant.TimeoutFailsafe = setTimeout(function () {
				//On va attendre 1 seconde de plus au cas ou l'app était juste en background.
				setTimeout(function () {
					if (callbackCourant.Callback) {
						callbackCourant.Callback.apply(null, callbackCourant.Arguments);
					}
					//L'erreur arrive bcp trop souvent sur ios 3.0.2 et moins, j'omnigarde pas ces cas la.
					if (hasLogWorker() && Skytech.Commun.Utils.Support.IsMinimumVersion("3.0.3", undefined)) {
						//ex MOBILE_NATIF_0003
						Skytech.Commun.Application.LogWorker.LogWarning("Pas d'appel du callback de SetCodeUserAgent après 8 secondes.");
					}
				}, 1000);
			}, 7000);
		} else {
			if (callbackCourant.Callback) {
				callbackCourant.Callback.apply(null, callbackCourant.Arguments);
			}
		}

		if (isAppJs())
			addLogDebugCodeUA("SetCodeUserAgent (" + code + ")");

		arrObjCallbacksSetCodeUserAgent.push(callbackCourant);
	};
	Ovx.Storage.SetCodeUserAgentCallBack = function (arrInfo) {
		/*
		*/
		if (typeof arrInfo.UserAgentRequete !== "undefined") {
			window.userAgentRequete = arrInfo.UserAgentRequete;
			//[B58791] 2015-02-16, Guillaume Chabot:
			//	Il faut appeler init afin que Skytech.Commun.Utils.Support.AppVersion se mette à jour selon userAgentRequete
			if (isAppJs()) {
				Skytech.Commun.Utils.Support.Initialize();
			}
		}

		arrObjCallbacksSetCodeUserAgent.forEach(function (item) {
			clearTimeout(item.TimeoutFailsafe);

			if (!item.Callback) {
				return;
			}

			item.Callback.apply(null, item.Arguments);
		});

		arrObjCallbacksSetCodeUserAgent = [];
	};

	Ovx.Storage.SetInfo = function (key, value) {
		/*
		* Sauvegarde les informations passées en paramètres.
		*
		* String : Key, clé permettant d'identifier la valeur à sauvegarder localement.
		* String : Value, chaîne à sauvegarder localement encodée au format URLEncode.
		*/

		var arrParametres = {
			"Key": key
			, "Value": value
		};

		ExecuteCommand("Storage.SetInfo", arrParametres);
	};
	Ovx.Storage.SetInfoCallBack = function (arrInfo) {
		/*
		* Valeurs retournées par le dictionnaire arrInfo :
		*
		* string : Key, code d'authentification
		* string : Value, valeur précédemment sauvegardée
		*/
	};

	var getInfoCallback = null;
	Ovx.Storage.GetInfo = function (key, callback) {
		/*
		* Retourne à l'application JS la valeur stockée localement
		*
		* String : Key, nom du paramètre à obtenir l'information.
		*/
		getInfoCallback = callback;

		var arrParametres = {
			"Key": key
		};

		ExecuteCommand("Storage.GetInfo", arrParametres);
	};
	Ovx.Storage.GetInfoCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : Key, code d'authentification
		* string : Value, valeur précédemment sauvegardée
		*/
		if (getInfoCallback !== null) {
			getInfoCallback(arrInfo.Key, arrInfo.Value);
			getInfoCallback = null;
		}
	};

	// === Clipboard ===
	window.Ovx.Clipboard = {};

	Ovx.Clipboard.CopyToClipboard = function (text) {
		/*
		* Sauvegarde les informations passées en paramètres.
		*
		* String : Text, la valeur à mettre dans le clipboard
		*/

		var arrParametres = {
			"Text": text
		};

		ExecuteCommand("Clipboard.CopyToClipboard", arrParametres);
	};

	// === Display ===
	window.Ovx.Display = {};
	Ovx.Display.SetLanguage = function (l) {
		/*
		* Modifie la langue d'affichage de l'application.
		*
		* optionnel string : L, [FRA | ANG | ESP] langue d'affichage de la page
		*/

		var arrParametres = {};
		if (typeof l !== "undefined") {
			arrParametres["L"] = l;
		}

		ExecuteCommand("Display.SetLanguage", arrParametres);
	};

	// === Display ===
	createCommand({
		Name: 'Display.ViewAppSettings'
	});

	Ovx.Display.ViewCommunicationError = function (mode) {
		/*
		* Affiche la page d'identification.
		*
		* optionnel mode : Quelles page d'erreur on veut afficher.
		*/

		var arrParametres = {};

		if (typeof mode !== "undefined") {
			arrParametres["ErrorMode"] = mode;
		}

		ExecuteCommand("Display.ViewCommunicationError", arrParametres);
	};

	var _viewDocumentExtension = null;

	Ovx.Display.ViewDocument = function (url, textBtnBack, textTitrePopup, textTitre, textCancel, l, extension) {
		/*
		* Permets d'afficher un document dans une nouvelle fenêtre.
		*
		* String : Url, adresse de la page à accéder encodée au format URLEncode.
		* String : TextBtnBack, texte du lien retour à affiché à l'utilisateur
		* String : TextTitrePopup, texte du popup des actions encodée au format URLEncode
		* String : TextTitre, texte à afficher au centre du header au format URLEncode
		* String : TextCancel, texte à afficher sur le contrôle de chargement pour annuler au format URLEncode
		* String : ErrorUrl, page de redirection en cas d'une erreur du côté natif au format URLEncode
		* optionnel string : L, [FRA | ANG | ESP] langue d'affichage de la page
		*/

		_viewDocumentExtension = extension;
		var errorUrl = encodeURI(document.location.origin + "/Mobl/App/ErreurDocument");

		var arrParametres = {
			"Url": url
			, "TextBtnBack": textBtnBack
			, "TextTitrePopup": textTitrePopup
			, "TextTitre": textTitre
			, "TextCancel": textCancel
			, "ErrorURL": errorUrl
		};
		if (typeof l !== "undefined") {
			arrParametres["L"] = l;
		}

		ExecuteCommand("Display.ViewDocument", arrParametres);
	};
	var _viewDocumentCallBack = null;
	Ovx.Display.ViewDocumentCallBack = function (info) {
		/*
			Callback appelé à divers moments lors de l'ouverture du document.
			Avant 3.0.1, ce callback est appelé seulement par iOS avec aucun argument.
			Depuis 3.0.1, ce callback est appelé pour les deux plateformes avec un argument
			représentant l'état courant de l'ouverture du document.

			info: un objet contenant les informations suivantes:
				State: Peut valoir:
					"Started": Indique que le téléchargment du document est démarré.
						Cet état correspond au callback fait par iOS avant 3.0.1 sans arguments.
					"Failed": Le téléchargment a échoué. Plus d'informations sont disponibles
						dans le champ Reason.
					"Finished": Le téléchargment est terminé et le document est ouvert.
					"UserCancelled": L'utilisateur à annulé le téléchargment.
				Reason: Présent seulement lorsque le l'état est "Failed".
					Peut valoir:
					"ServerError": Android seulement. Indique que le serveur a renvoyé le content-type
						personalisé indiquant une erreur de serveur.
					"InvalidMimetype": Android et iOS. Indique que le content-type du document
						est blacklisté et n'est pas affiché.
					"CommunicationError": Android et iOS. Indique que l'application a rencontré une erreur
						lors du téléchargement du document.
					"CannotSaveFile": iOS seulement. Indique que l'application n'a pas pu enregister
						le document téléchargé sur l'appareil.
		*/

		if (typeof _viewDocumentCallBack === 'function') {
			_viewDocumentCallBack(info);
		}

		// Si on a pas d'info ou que Skytech n'existe pas.. on stop l'exécution
		// Si on a pas un state qu'on gère dans le bas, on stop aussi
		if (!window.Skytech || !info || info.State !== 'Failed') {
			return;
		}

		// L'ouverture des pages d'erreurs a été déplacé dans le javascript
		// après la version 3.0.1 pour les deux plateformes..

		if (!Skytech.Commun.Utils.Support.IsMinimumVersion("3.0.2", "3.0.2")) {
			return;
		}

		if (info.State === "Failed" && (info.Reason === "ServerError" ||
			info.Reason === "InvalidMimetype")) {
			// Si on n'a pas passé d'extension on va essayer de guess avec le MimeType.
			// Extrait la 2e partie du mimetype si il en a une.
			// ex: image/png -> png
			var extension = _viewDocumentExtension ? _viewDocumentExtension : ((info.MimeType && info.MimeType.split("/")[1]) || info.MimeType);
			Ovx.WebUI.OpenNewWindow(
				// On renvoie aussi le mime-type pour détecter les cas que le serveur renvoie pas le bon selon l'extension du fichier à obtenir.
				encodeURIComponent(document.location.origin + "/Mobl/App/ErreurDocument?typeErreur=" + info.Reason + (extension ? "&extension=" + extension : "") + "&mimeType=" + encodeURIComponent(info.MimeType ? info.MimeType : '')),
				false, // displayNavigationBar
                false, // displayAltNavigationBar
				false, // displayToolbar
                false, // useWebKit
                false, // useExistingView
				"",
				Skytech.Commun.Application.ClientConfig.Dictio.COMMUN.MSG_0001,
                ""
			);
		}

		if (info.State === "Failed" && info.Reason === "PermissionError") {
			Skytech.Commun.UI.Utils.ShowPopupPermission(Skytech.Commun.UI.Utils.TypeShowPopupPermission.DOWNLOAD);
		}
	};
	Ovx.Display.SetViewDocumentCallBack = function (callback) {
		_viewDocumentCallBack = callback;
	};

	Ovx.Display.ViewLogin = function (l, typeLogin, identifiant) {
		/*
		 * Affiche la page d'identification.
		 *
		 * optionnel string : L, [FRA | ANG | ESP] langue d'affichage de la page
		 * optionnel int : TypeLogin, [1 | 2] page de login à afficher
		 * optionnel string : Identfiant, identifiant à écrire sur la page de login
		 */

		var arrParametres = {};
		if (typeof l !== "undefined") {
			arrParametres["L"] = l;
		}

		if (typeof typeLogin !== "undefined") {
			arrParametres["TypeLogin"] = typeLogin;
		}

		if (typeof identifiant !== "undefined") {
			arrParametres["Identifiant"] = identifiant;
		}

		ExecuteCommand("Display.ViewLogin", arrParametres);
	};

    Ovx.Display.ViewStudentEmployee = function (l) {
        /*
         * Affiche la page de sélection étudiant ou employé.
         *
         * optionnel string : L, [FRA | ANG | ESP] langue d'affichage de la page
         */

        var arrParametres = {};
        if (typeof l !== "undefined") {
            arrParametres["L"] = l;
        }

        ExecuteCommand("Display.ViewStudentEmployee", arrParametres);
    };

	Ovx.Display.ViewInfo = function (l) {
		/*
		* Affiche la page d'informations
		*
		* optionnel string : L, [FRA | ANG | ESP] langue d'affichage de la page
		*/

		var arrParametres = {};
		if (typeof l !== "undefined") {
			arrParametres["L"] = l;
		}

		ExecuteCommand("Display.ViewInfo", arrParametres);
	};

	Ovx.Display.Print = function (url) {
		var arrParametres = {
			Url: url
		};
		ExecuteCommand("Display.Print", arrParametres);
	};

	Ovx.Display.Scanner = function (instructions, callback) {
		callbackScanner = callback;
		ExecuteCommand("Display.Scanner", {
			Instructions: instructions
		});
	};

	var callbackScanner = null;
	Ovx.Display.ScannerCallBack = function (data) {
		if (callbackScanner) {
			callbackScanner.call(null, data);
			callbackScanner = null;
		}
	};

	/// <summary>
	/// Ovx.Display.Authenticate
	/// </summary>
	/// <param name="params" type="Object">Les paramètres de la commande</param>
	/// <param name="params.Message" type="String">Le message affiché dans le popup d'authentification</params>
	/// <param name="callback" type="Function">
	/// Result:
	///   0: OK
	///   1: Pas de sensor
	///   2: Utilisateur cancel
	///   3: Utiliser password
	/// </param>
	createCommand({ Name: 'Display.Authenticate' });

	/// <summary>
	/// Ovx.Display.SetBrightness
	/// </summary>
	/// <param name="Value" type="Number">
	/// La valeur de brightness entre 0 et 1. Si on passe un chiffre < 0
	/// la brightness va être reset à la valeur que le user avait avant.
	/// </param>
	createCommand({ Name: 'Display.SetBrightness' });

	createCommand({ Name: 'Display.OpenCamera' });

    // Biométrie hardware.

    //
    // Ovx.Biometry.GetCapabilities
    //
    // Obtient les capacités biométriques de l'appareil.
    //
    // Paramètres:
    //
    // bool TestHardwareKeyStorage:
    //      Permet d'ajouter le test de stockage hardware qui détermine si le stockage
    //      de la clé générée est isolée et ne permet pas d'exporter celle-ci.
    // bool TestDevicePasswordSet:
	//      Permet d'ajouter le test pour le mot de passe de l'appareil.
    //      Cela permet d'utiliser celui-ci au lieu d'éléments biométriques si on le veut.
    //
    // Objet de retour:
    //
    // string SensorType:
    //      Indique quel est le type de capteur biométrique.
    //      Pour le moment, elle peut avoir la valeur 'face' ou 'fingerprint'.
    // bool BiometryUnavailable:
	//      Indique que la biométrie n'est pas disponible.
    // bool DeviceBiometryNotSetup:
    //      Indique que le lecteur biométrique est présent mais il n'est pas configuré
    //      sur l'appareil.
    // bool IsDevicePasswordSet:
    //      Le résultat du test supplémentaire demandé, soit si l'appareil a un mot de passe.
    // bool CanUseHardwareStorage:
    //      Le résultat du test supplémentaire demandé, soit s'il est possible de
    //      générer une clé non-exportable.
    //
	createCommand({
	    Name: 'Biometry.GetCapabilities',
	    UseContextSensitiveEncoding: true
	});

    //
    // Ovx.Biometry.GenerateSigningKey
    //
    // Génère le proxy des éléments biométriques, soit une clé verrouillée par des
    // éléments biométriques.
    //
    // Paramètres:
    //
    // bool AllowDevicePassword:
    //      Fait en sorte que la clé est seulement protégée par le mot de passe de l'appareil.
    //
    // Objet de retour:
    //
    // bool Success:
    //      Indique si le processus a réussi.
    // string PublicKey:
    //      Une chaîne repésentant la clé publique liée aux éléments biométriques.
    //
	createCommand({
	    Name: 'Biometry.GenerateSigningKey',
	    UseContextSensitiveEncoding: true
	});

    //
    // Ovx.Biometry.SignData
    //
    // Signe des données avec la clé liée à des éléments biométriques.
    //
    // Paramètres:
    //
    // string Data:
    //      Les données à signer sous forme de chaîne.
    // string DataTransform:
    //      La transformation à appliquer sur la chaîne pour obtenir les octets.
    //      Les valeurs supportées sont 'utf8' et 'base64'.
    //      Attention de bien utiliser 'utf8', il est bien demandé de passer des
    //      données UTF8 et non tout autre encodage.
    // string Prompt:
    //      Le texte à afficher dans la fenêtre système pour déverrouiller la clé.
    // bool IsGeneratingKey:
    //      Indique que le processus de génération de clé est en cours.
    //      Sert à ne pas valider si la configuration est terminée comme elle
	//      est en cours.
    //
    // Objet de retour:
    //
    // bool Success:
    //      Indique si le processus de signature a réussi.
    // bool UserCancelled:
    //      Indique que l'utilisateur a annulé la demande de signature.
    // string Signature:
    //      La signature sur les octets passés en paramètre après la transformation.
    //
	createCommand({
	    Name: 'Biometry.SignData',
	    UseContextSensitiveEncoding: true
	});
    
    //
    // Ovx.Biometry.GetState
    //
    // Obtient des informations sur l'état de la clé liée à des élments biométriques.
    //
    // Objet de retour:
    //
    // bool KeyInStorage:
    //      Indique que la clé a été trouvée sur l'appareil.
    // bool BiometrySetupComplete:
    //      Indique que le processus d'association a été fait en entier.
    //
	createCommand({
	    Name: 'Biometry.GetState',
	    UseContextSensitiveEncoding: true
	});

    //
    // Ovx.Biometry.SetSetupDone
    //
    // Stocke le fait que le procesus d'association est terminé et que le serveur a
    // accepté la clé publique soumise auparavant.
    // On ne peut utiliser le local storage à cause des préoccupations de cross-origin
    // comme on a plusieurs domaines.
    //
	createCommand({
	    Name: 'Biometry.SetSetupDone',
	    UseContextSensitiveEncoding: true
	});

    //
    // Ovx.Biometry.SetSetupDone
    //
    // Combine les résultats de 'Biometry.GetCapabilities' et 'Biometry.GetState'.
    //
    // Prend les même paramètres que les deux commandes spécifiées et retourne
    // un objet représentant l'union des deux commandes.
    //
	createCommand({
	    Name: 'Biometry.GetCapabilitiesAndState',
	    UseContextSensitiveEncoding: true
	});

    //
    // Ovx.Biometry.DeleteKey
    //
    // Efface la clé liée aux éléments biométriques.
    //
	createCommand({
	    Name: 'Biometry.DeleteKey',
	    UseContextSensitiveEncoding: true
	});

	// === IOS Notification ===
	window.Ovx.IOS.Notification = {};
	var callbackGetEnabledRemoteNotificationTypes = null;
	Ovx.IOS.Notification.GetEnabledRemoteNotificationTypes = function (callback) {
		/*
		* Permet d'obtenir les types de notifications qui sont présentement actives pour l'application.
		* Utilise les valeurs retournées par la méthode enabledRemoteNotificationTypes de la classe NSApplication.
		*
		* Aucun paramètre
		*/
		callbackGetEnabledRemoteNotificationTypes = callback || null;

		var arrParametres = {};
		ExecuteCommand("IOS.Notification.GetEnabledRemoteNotificationTypes", arrParametres);
	};
	Ovx.IOS.Notification.GetEnabledRemoteNotificationTypesCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : EnabledRemoteNotificationTypes, liste des types de notifications présentement actives. Valeurs séparées par des virgules : [Badge | Sound | Alert]
		*/
		if (callbackGetEnabledRemoteNotificationTypes === null) {
			return;
		}

		callbackGetEnabledRemoteNotificationTypes.apply(null, [arrInfo]);
		callbackGetEnabledRemoteNotificationTypes = null;
	};

	var callbackRegisterForRemoteNotification = null;
	Ovx.IOS.Notification.RegisterForRemoteNotification = function (defaultNotificationType, callback) {
		/*
		* Permet d'obtenir le token de communication pour les push notifications.
		*
		* string : DefaultNotificationType, liste des types de notifications actives. Valeurs séparées par des virgules : [Badge | Sound | Alert]
		*/
		callbackRegisterForRemoteNotification = callback || null;

		var arrParametres = {
			"DefaultNotificationType": defaultNotificationType
		};

		ExecuteCommand("IOS.Notification.RegisterForRemoteNotification", arrParametres);
	};
	Ovx.IOS.Notification.RegisterForRemoteNotificationCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : RemoteNotificationTokenBase64, token binaire de l'appareil au format Base64.
		*/
		if (callbackRegisterForRemoteNotification === null) {
			return;
		}

		callbackRegisterForRemoteNotification.apply(null, [arrInfo]);
		callbackRegisterForRemoteNotification = null;
	};

	var callbackOnReceivedNotification = null;
	Ovx.IOS.Notification.SetOnReceivedNotificationCallBack = function (callback) {
		callbackOnReceivedNotification = callback;
	};

	Ovx.IOS.Notification.OnReceivedNotification = function () {
		/*
		* Lorsque l'application est active et qu'une notification est acheminée au téléphone, la méthode suivante est appelée sur l'App JS afin d'effectuer le traitement de l'affichage de la notification.
		*
		* Note : selon l'état de l'application lors de la réception de la notification, il est possible que cette commande soit initiée par l'App JS ou par l'App iOS. Se référer à la section Notifications pour plus de détail.
		*
		* Aucun paramètre
		*/
		var arrParametres = {};
		ExecuteCommand("IOS.Notification.OnReceivedNotification", arrParametres);
	};
	Ovx.IOS.Notification.OnReceivedNotificationCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : NotificationUserInfo, information sur la notification formatée tel que reçu par Apple
		*/
		if (callbackOnReceivedNotification === null) {
			return;
		}

		callbackOnReceivedNotification.apply(null, [arrInfo.NotificationUserInfo]);
	};

	var callbackSetBadge = null;
	Ovx.IOS.Notification.SetBadge = function (number, callback) {
		/*
		* Modifier le nombre affiché à proximité de l'icône sur la page d'accueil de l'utilisateur.
		*
		* String : Number, nombre à afficher à proximité de l'icône sur la page d'accueil de l'utilisateur.
		*/
		callbackSetBadge = callback || null;

		var arrParametres = {
			"Number": number
		};

		ExecuteCommand("IOS.Notification.SetBadge", arrParametres);
	};
	Ovx.IOS.Notification.SetBadgeCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : Number, nombre qui est affiché à proximité de l'icône de l'App iOS.
		*/
		if (callbackSetBadge === null) {
			return;
		}

		callbackSetBadge.apply(null, [arrInfo.Number]);
		callbackSetBadge = null;
	};

	// === Android Notification ===
	window.Ovx.Android.Notification = {};
	var callbackIsGooglePlayServicesAvailable = null;
	Ovx.Android.Notification.IsGooglePlayServicesAvailable = function (callback) {
		if (isAppJs() && Skytech.Commun.Application.IsIntegrationTest && callback) {
			callback(true);
			return;
		}
		/*
		* Permet de vérifier si l'appareil est prêt à utiliser les services du Google Play que l'APK va se servir pour recevoir les notifications.
		*
		* Aucun paramètre
		*/
		callbackIsGooglePlayServicesAvailable = callback || null;

		var arrParametres = {};
		ExecuteCommand("Android.Notification.IsGooglePlayServicesAvailable", arrParametres);
	};
	Ovx.Android.Notification.IsGooglePlayServicesAvailableCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : IsAvailable, True | False, indique si les services Google Play sont prêts à être utilisés sur l'appareil.
		*/
		if (callbackIsGooglePlayServicesAvailable === null) {
			return;
		}

		callbackIsGooglePlayServicesAvailable.apply(null, [arrInfo.IsAvailable, arrInfo.IsBackgroundRestricted]);
		callbackIsGooglePlayServicesAvailable = null;
	};

	/*
	 * Permet d'obtenir le token de communication pour le Google Cloud Messaging.
	 * Params
	 *   ForceUpdate: bool, si on doit aller chercher le token des serveurs de google même si on l'a en cache sur le téléphone.
	 * Callback
	 *   RegistrationID: string, token de communication retourné par le Google Cloud Messaging.
	 */
	createCommand({ Name: 'Android.Notification.Register' });

	var callbackOnReceive = null;
	Ovx.Android.Notification.SetOnReceiveCallBack = function (callback) {
		callbackOnReceive = callback;
	};

	Ovx.Android.Notification.OnReceive = function () {
		/*
		* Lorsque l'application est active et qu'une notification est acheminée au téléphone, la méthode suivante est appelée sur l'App JS afin d'effectuer le traitement de l'affichage de la notification.
		*
		* Note : selon l'état de l'application lors de la réception de la notification, il est possible que cette commande soit initiée par l'App JS ou par l'App iOS. Se référer à la section Notifications pour plus de détail.
		*
		* Aucun paramètre
		*/
		var arrParametres = {};
		ExecuteCommand("Android.Notification.OnReceive", arrParametres);
	};
	Ovx.Android.Notification.OnReceiveCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : NotificationMessage, information sur la notification formatée tel que reçu par le GCM en format JSON.
		*/
		if (callbackOnReceive === null) {
			return;
		}

		callbackOnReceive.apply(null, [arrInfo.NotificationMessage, arrInfo.NotificationOpenedApp]);
	};

	// === IOS Purchase ===
	window.Ovx.IOS.Purchase = {};
	var callbackGetProductInfo = null;
	Ovx.IOS.Purchase.GetProductInfo = function (productIdentifiers, callback) {
		/*
		* Permet d'obtenir la liste des produits disponibles pour achat.
		*
		* string : ProductIdentifier, la liste des Identifiers de produits séparés par des virgules
		*/
		callbackGetProductInfo = callback || null;

		var arrParametres = {
			"productIdentifiers": productIdentifiers
		};

		ExecuteCommand("IOS.Purchase.GetProductInfo", arrParametres);
	};
	Ovx.IOS.Purchase.GetProductInfoCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* int : CanMakePayments, indique si l'utilisateur a bien activé le paiement, retour de la méthode [SKPaymentQueue canMakePayments].
		* Array : ProductList, liste de différents produits disponible pour la vente. Les propriétés suivantes sont disponibles pour chacun des produits : localizedDescription, localizedTitle, price, priceLocale, productIdentifier.
		*/
		if (callbackGetProductInfo === null) {
			return;
		}

		callbackGetProductInfo.apply(null, [arrInfo.ProductList, arrInfo.CanMakePayments]);
		callbackGetProductInfo = null;
	};

	var callbackRequestPayment = null;
	Ovx.IOS.Purchase.RequestPayment = function (productIdentifier, applicationUsername, callback, quantity) {
		/*
		* Avant tout traitement, l'App iOS vérifie la disponibilité du paiement pour l'utilisateur à l'aide de la méthode [SKPaymentQueue canMakePayments].
		*
		* Ensuite, la demande de paiement est effectuée à l'aide du StoreKit.
		*
		* string : ProductIdentifier, identifiant du produit à acheter
		* string : ApplicationUsername, numéro de la transaction de paiement Omnivox stockée dans le champ applicationUsername du paiement
		* string : Quantity, nombre de produit à acheter
		*/
		callbackRequestPayment = callback || null;

		var arrParametres = {
			"ProductIdentifier": productIdentifier
			, "ApplicationUsername": applicationUsername
			, "Quantity": quantity
		};

		ExecuteCommand("IOS.Purchase.RequestPayment", arrParametres);
	};
	Ovx.IOS.Purchase.RequestPaymentCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* int : CanMakePayments, indique si l'utilisateur a bien activé le paiement, retour de la méthode [SKPaymentQueue canMakePayments].
		*/
		if (callbackRequestPayment === null) {
			return;
		}

		callbackRequestPayment.apply(null, [arrInfo.CanMakePayments, arrInfo.IsCanceled]);
		callbackRequestPayment = null;
	};

	var onUpdatedPaymentCallback = null;
	Ovx.IOS.Purchase.SetUpdatedPaymentCallback = function (callback) {
		//Permet de setter un callback à appeler quand Ovx.IOS.Purchase.OnUpdatedPayment est exécuté
		if (typeof callback === 'function') {
			onUpdatedPaymentCallback = callback;
		} else {
			onUpdatedPaymentCallback = null;
		}
	};

	Ovx.IOS.Purchase.OnUpdatedPayment = function (arrInfo) {
		/*
		* Lorsque l'événement paymentQueue:updatedTransactions est lancé par iOS, faire appel à la méthode de l'App JS : Ovx.IOS.Purchase.OnUpdatedPayment(arrInfo) afin qu'Omnivox complète les transactions de paiement.
		*/
		if (onUpdatedPaymentCallback !== null) {
			onUpdatedPaymentCallback.apply(null, null);
		}
	};

	var callbackGetListPaymentQueued = null;
	Ovx.IOS.Purchase.GetListPaymentQueued = function (callback) {
		/*
		* Cette commande permet d'obtenir la liste des paiements présents dans la queue de paiement StoreKit.
		*
		* Note : cette commande ne doit PAS finaliser les transactions.
		*
		* Aucun paramètre
		*/
		callbackGetListPaymentQueued = callback || null;

		var arrParametres = {};
		ExecuteCommand("IOS.Purchase.GetListPaymentQueued", arrParametres);
	};
	Ovx.IOS.Purchase.GetListPaymentQueuedCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* Array : Array d'objet JavaScript contenant les informations sur chacun des produits contenu dans la queue de paiement :
		*	string : transactionIdentifier, numéro du reçu tel que fourni par le StoreKit (base64)
		*	string : productIdentifier, identifiant du produit
		*	int : quantity, nombre de produit à acheter
		*	string : applicationUsername, numéro de la transaction de paiement Omnivox stockée dans le champ applicationUsername du paiement
		*	string : TransactionReceipt, Chaine en format base64 utilisée afin de valider la facture
		*/
		if (callbackGetListPaymentQueued === null) {
			return;
		}

		callbackGetListPaymentQueued.apply(null, [arrInfo]);
		callbackGetListPaymentQueued = null;
	};

	var callbackFinishTransaction = null;
	Ovx.IOS.Purchase.FinishTransaction = function (transactionIdentifier, callback) {
		/*
		* Cette commande permet de compléter une transaction de paiement et de la retirer de la queue de paiement.
		*
		* string : TransactionIdentifier, numéro du reçu tel que fourni par le StoreKit (base64) et URLEncode
		*/
		callbackFinishTransaction = callback || null;

		var arrParametres = {
			"TransactionIdentifier": encodeURIComponent(transactionIdentifier)
		};

		ExecuteCommand("IOS.Purchase.FinishTransaction", arrParametres);
	};
	Ovx.IOS.Purchase.FinishTransactionCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* Aucune
		*/
		if (callbackFinishTransaction === null) {
			return;
		}

		callbackFinishTransaction.apply(null, [{}]);
		callbackFinishTransaction = null;
	};

	// === Android Purchase ===
	window.Ovx.Android.Purchase = {};
	var callbackGetSkuDetails = null;
	Ovx.Android.Purchase.GetSkuDetails = function (productIdentifiers, callback) {
		/*
		* Permet d'obtenir les informations d'une liste de produits disponibles pour achat.
		*
		* string : ProductIdentifiers, la liste des Identifiers de produits séparés par des virgules
		*/
		callbackGetSkuDetails = callback || null;

		var arrParametres = {
			"ProductIdentifiers": productIdentifiers
		};

		ExecuteCommand("Android.Purchase.GetSkuDetails", arrParametres);
	};
	Ovx.Android.Purchase.GetSkuDetailsCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : ResponseCode, indique le code de réponse retourné par l'API Google suite à la requête.
		* array : ProductList, liste des différents produits disponibles pour la vente. Les propriétés suivantes sont disponibles pour chacun des produits : productId, type, price, title, description.
		*/
		if (callbackGetSkuDetails === null) {
			return;
		}

		callbackGetSkuDetails.apply(null, [arrInfo.ProductList, arrInfo.ResponseCode]);
		callbackGetSkuDetails = null;
	};

	var callbackRequestPaymentAndroid = null;
	Ovx.Android.Purchase.RequestPayment = function (productIdentifier, applicationUsername, callback) {
		/*
		* Permet de déclencher la procédure de paiement pour un produit spécifié. Une fois le processus terminé, le callback est appelé afin de retourner les informations de la transaction effectuée.
		*
		* string : ProductIdentifier, identifiant du produit à acheter
		* string : ApplicationUsername, numéro de la transaction de paiement Omnivox stockée dans le champ applicationUsername du paiement
		*/
		callbackRequestPaymentAndroid = callback || null;

		var arrParametres = {
			"ProductIdentifier": productIdentifier
			, "ApplicationUsername": applicationUsername
		};

		ExecuteCommand("Android.Purchase.RequestPayment", arrParametres);
	};
	Ovx.Android.Purchase.RequestPaymentCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : ResponseCode, indique le code de réponse retourné par l'API Google suite à la requête.
		* string : InAppPurchaseData, Contient les informations nécessaires au paiement en format JSON. Informations retournées : orderId, packageName, productId, purchaseTime, purchaseState, developerPayload, purchaseToken.
		* string : InAppDataSignature, Clé de signature de l'achat générée à partir de la clé privée du développeur.
		*/
		if (callbackRequestPaymentAndroid === null) {
			return;
		}

		if (arrInfo) {
			callbackRequestPaymentAndroid.apply(null, [arrInfo.ResponseCode, arrInfo.InAppPurchaseData, arrInfo.InAppDataSignature, arrInfo.IsCanceled]);
		} else {
			//Si arrInfo est null, c'est qu'on a déjà acheté l'item.
			callbackRequestPaymentAndroid.apply(null, []);
		}

		callbackRequestPaymentAndroid = null;
	};

	var callbackGetPurchases = null;
	Ovx.Android.Purchase.GetPurchases = function (callback) {
		/*
		* Permet d'obtenir la liste des éléments achetés par l'utilisateur.
		*
		* Aucun paramètre
		*/
		callbackGetPurchases = callback || null;

		var arrParametres = {};
		ExecuteCommand("Android.Purchase.GetPurchases", arrParametres);
	};
	Ovx.Android.Purchase.GetPurchasesCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : ResponseCode, indique le code de réponse retourné par l'API Google suite à la requête.
		* array : InAppPurchaseItemList, liste des id de produits achetés à partir de l'application.
		* string : InAppPurchaseDataList, contient la liste des détails de chaque élément achetés en format JSON.
		*	Informations retournées pour chaque élément :
		*	orderId, packageName, productId, purchaseTime, purchaseState, developerPayload, purchaseToken.
		* array : InAppDataSignatureList, contient la liste des signatures des achats effectués par l'utilisateur.
		* Note : La valeur de INAPP_CONTINUATION_TOKEN retourné par la méthode native getPurchases() doit être géré automatiquement du côté natif.
		*	Il faut que la liste complète des éléments achetés par l'utilisateur soit retournée à l'app JS grâce à cette commande.
		*/
		if (callbackGetPurchases === null) {
			return;
		}

		callbackGetPurchases.apply(null, [arrInfo.InAppPurchaseItemList, arrInfo.InAppPurchaseDataList, arrInfo.InAppDataSignatureList]);
		callbackGetPurchases = null;
	};

	var callbackConsume = null;
	Ovx.Android.Purchase.Consume = function (purchaseToken, callback) {
		/*
		* Cette commande permet de consommer un élément acheté par l'utilisateur. Ceci va donc effectuer la confirmation que l'utilisateur s'est bel et bien procuré l'élément.
		*
		* string : PurchaseToken, token de l'élément acheté qui est retourné par le Play Store à la suite de la transaction de paiement.
		*/
		callbackConsume = callback || null;

		var arrParametres = {
			"PurchaseToken": purchaseToken
		};

		ExecuteCommand("Android.Purchase.Consume", arrParametres);
	};
	Ovx.Android.Purchase.ConsumeCallBack = function (arrInfo) {
		/*
		* Valeurs retournées
		*
		* string : ResponseCode, indique le code de réponse retourné par l'API Google suite à la requête.
		*/
		if (callbackConsume === null) {
			return;
		}

		callbackConsume.apply(null, [arrInfo.ResponseCode]);
		callbackConsume = null;
	};

	// === Theme ===

	/*
	* Set le thème
	*
	* string : NavigationBarColor [couleur FFFFFF]
	* string : NavigationBarTextColor [couleur FFFFFF]
	* string : NavigationBarLineColor [couleur FFFFFF]
	* string : StatusBarColor [couleur FFFFFF]
	* string : StatusBarTextStyle [light / dark], light va afficher du texte blanc par dessus la couleur sélectionné à StatusBarColor, alors que dark va afficher du texte noir
	*/
	createCommand({Name: 'Theme.SetTheme'});

	// === Boutons physiques de l'appareil ===
	window.Ovx.Android.Device = {};
	var redirectNativeCommandActive = null;
	Ovx.Android.Device.SetRedirectNativeCommand = function (enabled) {
		/*
		*
		*
		* Si l'option est active, lorsque l'utilisateur touche un « bouton natif » de l'appareil,
		* la méthode Device.OnTouch de l'AppJS sera appelée en remplacement de l'action native prévue.
		*
		* boolean : Enabled, Active ou désactive la fonctionnalité
		*
		*/

		// 2014-09-24 - Marc LeBlanc
		// On ne devrait pas appeler de méthode Android dans le code iOS.
		if (iOS) {
			return;
		}

		if (redirectNativeCommandActive !== null
			&& redirectNativeCommandActive === enabled) {
			return;
		}

		redirectNativeCommandActive = enabled;

		var arrParametres = {
			"Enabled": enabled
		};

		//COMPATIBILITÉ ANDROID 1.0.3 OU MOINS
		//	il faut appeler Android.SetRedirectNativeCommand et non Android.Device.SetRedirectNativeCommand
		var strNomCommande = "Android.Device.SetRedirectNativeCommand";
		if (isVieuxNamespaceAndroid) {
			strNomCommande = "Device.SetRedirectNativeCommand";
		}

		ExecuteCommand(strNomCommande, arrParametres);
	};

	Ovx.Android.Device.OnTouch = function (arrInfo) {
		/*
		*	Méthode appelée par l'app native Android lorsque l'utilisateur appuie sur un boutons physique
		*	ET que le paramètre SetRedirectNativeCommand est activé.
		*/
		if (typeof Ovx.Android.Device.OnTouchHandle === 'function') {
			Ovx.Android.Device.OnTouchHandle(arrInfo.CommandName);
		}
	};

	Ovx.Android.Device.IsTablet = function () {
		/*
		* Indique si l'appareil est une tablet
		*/
		// On doit simuler cette commande pour les tests unitaires et chrome.
		if (window.unitTest) {
			// Pour les tests unitaires on va juste checker si le user agent contient tablet.
			return window.userAgentRequete && window.userAgentRequete.indexOf('tablet') !== -1;
		} else if (isDebug) {
			// Pour débug dans chrome on va checker si le width est plus grand que le height.
			return window.innerWidth > window.innerHeight;
		}
		var arrParametres = {};
		var response = JSON.parse(ExecuteCommandSync("Android.Device.IsTablet", arrParametres));
		return response.IsTablet === 'True';
	};

	/// <summary>
	///		Permet de déterminer si l'appareil possède une caméra
	/// </summary>
	createCommand(
		{
			Name: 'Android.Device.HasCamera',
			ShouldExecute: function () {
				return !Skytech.Commun.Utils.Support.IOS && Skytech.Commun.Utils.Support.IsMinimumVersion("3.3.0", "3.3.0");
			}
		}
	);

	/// <summary>
	///		Ouvre un timepicker sur Android
	/// </summary>
	createCommand({ Name: 'Android.Device.OpenTimePicker' });

	/// <summary>
	///		Permet d'obtenir les informations sur le device de l'utilisateur, soit
	///		le nom du device, le fabricant et la version de l'OS.
	/// </summary>
	createCommand(
		{
			Name: 'Application.GetDeviceInfo'/*,
			ShouldExecute: function () {
				return Skytech.Commun.Utils.Support.IsMinimumVersion("3.3.1", "3.3.1");
			}*/
		}
	);

	var _fileChosenCallback;
	Ovx.Android.SetFileChosenCallback = function (callback) {
		_fileChosenCallback = callback;
	};

	Ovx.Android.FileChosenCallBack = function (arrInfo) {
		if (!arrInfo) {
			return;
		}

		if (arrInfo.Url && typeof _fileChosenCallback === 'function') {
			_fileChosenCallback(arrInfo.Url);
		}
	};

	Ovx.Android.OpenFile = function (realPath, contentType) {
		ExecuteCommand('Android.OpenFile', { 'Url': realPath, 'ContentType': contentType });
	};

	var _documentOpenedCallback;
	Ovx.Android.SetDocumentOpenedCallback = function (callback) {
		_documentOpenedCallback = callback;
	};

	Ovx.Android.DocumentOpenedCallBack = function (arrInfo) {
		if (typeof _documentOpenedCallback === 'function') {
			_documentOpenedCallback();
		}
	};

	Ovx.Android.OpenAppLink = function (appLink) {
		ExecuteCommand('Android.OpenAppLink', { 'AppLink': appLink });
	};

	Ovx.IOS.OpenAppLink = function (appLink) {
		ExecuteCommand('IOS.OpenAppLink', { 'AppLink': appLink });
	};

	function createCommand(params) {
		/// <summary>
		///		Crée une commande simple avec un callback.
		///		Par exemple, utiliser cette fonction avec "Display.SetBrightness" créera une commande
		///		dans le namespace Ovx.Display avec le nom SetBrightness qui prend en paramètre un objet et
		///		un callback.
		///		createCommand("Display.SetBrightness") -> Ovx.Display.SetBrightness({Value: 0.5}, callback);
		///		Dans le code natif il suffit de gérer la commande Display.SetBrightness et appeler Ovx.Display.SetBrightnessCallBack
		///		pour appeler son callback.
		/// </summary>
		/// <param name="params" type="Object">
		///		Paramètres de la commande à créer<br/>
		///		- Name: String Le nom complet de la commande<br/>
		///		- GetParams: Function (optional) Fonction qui map ses paramètres à l'objet passé à la commande. Retourne un objet avec
		///		"Args" qui sont les arguments passé à la commande et optionnelement "Callback" qui est le callback
		///		appelé par la commande.<br/>
		///		- ShouldExecute: Function (optional) Fonction qui retourne si on doit éxecuter la commande. Utile pour ne pas appeler certaines commandes
		///		qui n'existent pas sur des vieilles versions de l'app native.<br/>
		///		- OnCallback: Function (optional) Appelé lorsque le callback de la commande native est appelé avec comme paramètres
		///		le callback final et le data de la commande.
		/// </param>
		var commandCallback = null;
		var namespace = params.Name.split('.');
		var commandName = namespace[namespace.length - 1];
		var getParams = params.GetParams || function (args, callback) {
			return {
				Args: args,
				Callback: callback
			};
		};
		var shouldExecute = params.ShouldExecute || function () {
			return true;
		};
		var onCallback = params.OnCallback || function(callback, data) {
			if (callback) {
				callback.call(null, data);
			}
		};

		// Crée le namespace si il n'existe pas.
		var obj = window.Ovx;
		for (var i = 0; i < namespace.length - 1; i++) {
			obj[namespace[i]] = obj[namespace[i]] || {};
			obj = obj[namespace[i]];
		}

		// Crée la fonction pour appeler la commande.
		obj[commandName] = function commandFn() {
			var commandParams = getParams.apply(null, commandFn.arguments);
			if (!shouldExecute(commandParams)) {
				return;
			}
			commandCallback = commandParams.Callback;
			ExecuteCommand(
                params.Name,
                commandParams.Args || {},
                params.UseContextSensitiveEncoding
            );
		};

		// Crée le callback de la commande.
		obj[commandName + 'CallBack'] = function (data) {
			onCallback(commandCallback, data);
			commandCallback = null;
		};
	}

	function ExecuteCommand(strNomCommande, arrParametres, useContextSensitiveEncoding) {
	    // On vérifie si la commande a opt-in pour la nouvelle gestion des
	    // paramètres qui dépend du contexte.
	    // Utiliser ce comportement évite d'encoder quand c'est pas utile, c'est pas
	    // nécessaire sur Android et dans la WKWebView sur iOS.
	    // Par contre, le code natif ne doit pas décoder les paramètres lui-même.
        //
        // On veut ici un booléen seulement et pas une autre valeur passée par accident.
	    useContextSensitiveEncoding = useContextSensitiveEncoding === true;

		// [B52485] 2014-06-03, Janic Duplessis: On va tester le useragent aussi car omnible!!!
		if (iOS) {
			// [F32013] 2016-07-26, Michael Tran: On va vérifier si on est dans la WKWebView parce
			// que la webview webkit n'utilise pas le NSURLProtocol.
			if (!(window && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.ovx)) {
				var requete = PREFIXE_REQUETE + strNomCommande + "/";

				var nextQSSep = "?";
				for (var parametre in arrParametres) {

				    var value = arrParametres[parametre];
				    if (useContextSensitiveEncoding) {
				        // En encodant ici au bon moment et pour tous les paramètres, on
				        // évite de le faire manuellement et de causer des bugs weird.
				        value = encodeURIComponent(value);
				    }

					requete += nextQSSep + parametre + "=" + value;
					nextQSSep = "&";
				}

				ExecuteRequeteIframe(requete);
			} else {
				window.webkit.messageHandlers.ovx.postMessage({ Command: strNomCommande, Params: arrParametres });
			}
		} else {
			ExecuteCommandAsync(strNomCommande, arrParametres);
		}
	}

	// Execute une commande en synchrone et retourne le résulat
	function ExecuteCommandSync(strNomCommande, arrParametres) {
		if (iOS) {
			// Non implémenté sur ios
			throw new Error("Commandes synchrones non disponibles sur iOS");
		} else {
			var jsonString = JSON.stringify(arrParametres);
			if (!isDebug) {
				try {
					return OvxNatif.ExecuteCommand(strNomCommande, jsonString);
				} catch (e) {
					if (hasLogWorker())
						Skytech.Commun.Application.LogWorker.LogError("MOBILE_NATIF_0002", "Erreur lors de l'exécution d'une commande native sync. \r\n Commande: " + strNomCommande + "\r\n Params: " + JSON.stringify(arrParametres) + "\r\n Erreur: " + e);
					else
						throw Error("Erreur lors de l'exécution d'une commande native sync. \r\n Commande: " + strNomCommande + "\r\n Params: " + JSON.stringify(arrParametres) + "\r\n Erreur: " + e);
				}
			}
		}
	}

	//Laisser cette méthode privée svp, on veut pas avoir de logique d'ouverture d'iframe a l'extérieur de ce fichier js.
	function ExecuteRequeteIframe(requete) {
		var iframe = document.createElement("iframe");
		iframe.setAttribute("src", requete);

		document.body.appendChild(iframe);
		document.body.removeChild(iframe);
	}

	// Méthode permettant d'envoyer une commande async à l'application native (pour Android).
	function ExecuteCommandAsync(strNomCommande, arrParametres) {
		setTimeout(function () {
			var jsonString = JSON.stringify(arrParametres);
			if (!isDebug) {
				try {
					var result = OvxNatif.ExecuteCommand(strNomCommande, jsonString);

					//[B78308] 2017-05-29, Guillaume Chabot: La commande a échouée car l'app native n'a pas pu confirmer qu'on avait la page mobile de loadée, on re-essaie dans 100ms.
					if (result === "retry") {
						setTimeout(function () {
							OvxNatif.ExecuteCommand(strNomCommande, jsonString);
						}, 100);
					}
				} catch (e) {
					//On se calibouarge des erreurs arrivées sur les versions super vieilles des app natives...
					//	Je considère les erreurs suivantes comme corrigées:
					//	3.0.1: ReferenceError: Can't find variable: OvxNatif
					//	1.0.4: Error: Error calling method on NPObject.
					//[F36196] 2018-08-30, Guillaume Chabot: Si on peut pas faire le check car on a pas accès à IsMinimumVersion on va omnigarder.
					if (hasLogWorker()) {
						if (!Skytech.Commun.Utils.Support.IsMinimumVersion ||
							Skytech.Commun.Utils.Support.IsMinimumVersion('2.0.0', '3.0.2')) {
							Skytech.Commun.Application.LogWorker.LogError("MOBILE_NATIF_0001", "Erreur lors de l'exécution d'une commande native. \r\n Commande: " + strNomCommande + "\r\n Params: " + JSON.stringify(arrParametres) + "\r\n Erreur: " + e);
						}
					} else { 
						throw Error("Erreur lors de l'exécution d'une commande native. \r\n Commande: " + strNomCommande + "\r\n Params: " + JSON.stringify(arrParametres) + "\r\n Erreur: " + e);
					}
				}
			}
		}, 1);
	}

	function functionFromCommand(baseNamespace, command) {
		return command.split('.').reduce(function (prev, cur) {
			if (prev[cur]) {
				return prev[cur];
			}
			return prev;
		}, baseNamespace);
	}

	// Exécute un callback dans un setTimeout
	Ovx.ExecuteCallback = function (command) {
		// Les autres paramètres sont les arguments passés à la commande.
		// Arguments est un objet vraiment poche :(
		// Pour ne pas tuer l'optimisation js on il faut le copier avec un for loop.
		// https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
		var args = new Array(arguments.length);
		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}
		setTimeout(function () {
			var callback = functionFromCommand(Ovx, command);
			if (typeof callback === 'function') {
				callback.apply(null, args.slice(1));
			}
		}, 1);
	};

	//COMPATIBILITÉ ANDROID 1.0.3 OU MOINS
	var isVieuxNamespaceAndroid = false;
	Ovx.ActiveSupportVieuxNamespaceAndroid = function () {
		//	Les android 1.0.2 et moins vont appler des méthodes genre Ovx.Device.OnTouch au lieu de Ovx.Android.Device.OnTouch
		//	Il ne faut pas les briser, donc on va devoir faire ca.
		Ovx.Device = Ovx.Android.Device;

		isVieuxNamespaceAndroid = true;
	};

	function addLogDebugCodeUA(rowLog) {
		var arrDebugCodeUA = Skytech.Commun.Utils.LocalStorage.GetData("debug-codeUA", []);
		arrDebugCodeUA.push({ log: rowLog, date: new Date() });
		arrDebugCodeUA = arrDebugCodeUA.slice(Math.max(arrDebugCodeUA.length - 20, 0));
		Skytech.Commun.Utils.LocalStorage.SetData("debug-codeUA", arrDebugCodeUA, false, { versionPersistant: true });
	}

	/**
	 * Effectue l'envoi de statistiques au module ATIC, s'il y en a de récolté. 
	 */
	function sendAnalytics() {
		if (typeof Skytech === 'undefined' || typeof Skytech.Analytics === 'undefined') //Module ATIC non détecté, rien à faire.
			return;

		Skytech.Analytics.send();
	}

}());