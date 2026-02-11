import { MioModel } from "@typings/Mio/Messages";
import { MioSearch } from "@typings/Mio/Search";
import { makeSkytechRequest } from "../puppet/index";
import { MioFolders } from "@typings/Mio/Folders";

export function GetListeFoldersModel() {
    return makeSkytechRequest<MioFolders.ResponseModel>(
        '/Mobl/Mio/GetListeFoldersModel',
        {}
    );
}

export function GetLatestMessages(folder: string, count = 21) {
    return makeSkytechRequest<MioModel.ResponseModel>(
        '/Mobl/Mio/GetLatestMessages',
        {
            "IdFolder": folder,
            "NbMessages": count,
            "DateHeureDerniereUpdate": 0,
            "NombreItemDernierUpdate": 0,
            "Force": false,
            "UtilisationQuota": 61168646
        }
    );
}

export function GetMessages(folder: string, lastId: string, count = 20) {
    return makeSkytechRequest<MioModel.ResponseModel>(
        '/Mobl/Mio/GetMessages',
        {
            "IdFolder": folder,
            "DernierOidMessage": lastId,
            "IndicateurDernierMioEnvoi": false,
            "NbMessages": count
        }
    );
}

export function SearchMessages(folder: string, query: string, count = 21) {
    return makeSkytechRequest<MioModel.ResponseModel>(
        '/Mobl/Mio/SearchMessages',
        {
            "IdFolder": folder,
            "NbMessages": count,
            "SearchText": query
        }
    );
}

export function SendMessage(to: string, subject: string, message: string) {
    return makeSkytechRequest<any>(
        '/Mobl/Mio/SendMessage',
        {
            "IDMessage": null,
            "To": to,
            "Message": message,
            "Sujet": subject,
            "Attachements": [],
            "IDMessageReply": "undefined",
            "derniereAction": "0",
            "CacheDestinataire": false
        }
    ).then(r => !!r);
}

export function CategoriseMessage(messageId: string, folderId: string) {
    return makeSkytechRequest<any>(
        '/Mobl/Mio/CategoriseMessage',
        {
            "oidMessage": messageId,
            "nomCategorie": folderId,
            "isEnvoyeur": false
        }
    ).then(r => !!r);
}

export function SetIndicateursMessage(messageId: string, starFlag: boolean, reReadFlag: boolean) {
    return makeSkytechRequest<any>(
        '/Mobl/Mio/SetIndicateursMessage',
        {
            "Id": messageId,
            "indicateurs": {
                "Drapeau": starFlag,
                "ARelire": reReadFlag
            },
            "IsEnvoi": false
        }
    ).then(r => !!r);
}

export function DeleteMessage(messageId: string) {
    return makeSkytechRequest<any>(
        '/Mobl/Mio/DeleteMessage',
        {
            "Id": messageId,
            "SupprimerPermanent": false,
            "Envoie": false
        }
    ).then(r => !!r);
}

export function RechercheIndividu(query: string) {
    return makeSkytechRequest<MioSearch.IndividuItem[]>(
        '/Mobl/Mio/RechercheIndividu',
        { "TexteRecherche": query }
    );
}

export function AjoutCategorie(nomCategorie: string) {
    return makeSkytechRequest<any>(
        '/Mobl/Mio/AjoutCategorie',
        {
            "nomCategorie": nomCategorie
        }
    ).then(r => !!r);
}
