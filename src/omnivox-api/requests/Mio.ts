import { MioModel } from "@typings/Mio/Messages";
import { MioSearch } from "@typings/Mio/Search";
import { omnivox, DownloadResult } from "../puppet";
import { MioFolders } from "@typings/Mio/Folders";
import { getConfig } from "../config";

export function GetListeFoldersModel() {
    return omnivox.postJson<MioFolders.ResponseModel>(
        '/Mobl/Mio/GetListeFoldersModel',
        {}
    );
}

export function GetLatestMessages(folder: string, count = 21) {
    return omnivox.postJson<MioModel.ResponseModel>(
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
    return omnivox.postJson<MioModel.ResponseModel>(
        '/Mobl/Mio/GetMessages',
        {
            "IdFolder": folder,
            "DernierOidMessage": lastId,
            "IndicateurDernierMioEnvoi": false,
            "NbMessages": count
        }
    );
}

export function GetMessage(messageId: string) {
    return omnivox.postJson<MioModel.MessageResponse>(
        '/Mobl/Mio/GetMessage',
        { "IdMessage": messageId }
    );
}

export function SearchMessages(folder: string, query: string, count = 21) {
    return omnivox.postJson<MioModel.ResponseModel>(
        '/Mobl/Mio/SearchMessages',
        {
            "IdFolder": folder,
            "NbMessages": count,
            "SearchText": query
        }
    );
}

export function SendMessage(to: string, subject: string, message: string, cacheDestinataire = false, replyToId?: string, replyAll = false) {
    return omnivox.postJson<any>(
        '/Mobl/Mio/SendMessage',
        {
            "IDMessage": null,
            "To": to,
            "Message": message,
            "Sujet": subject,
            "Attachements": [],
            "IDMessageReply": replyToId ?? "undefined",
            "derniereAction": replyToId ? (replyAll ? "3" : "1") : "0",
            "CacheDestinataire": cacheDestinataire
        }
    ).then(r => !!r);
}

export function CategoriseMessage(messageId: string, folderId: string) {
    return omnivox.postJson<any>(
        '/Mobl/Mio/CategoriseMessage',
        {
            "oidMessage": messageId,
            "nomCategorie": folderId,
            "isEnvoyeur": false
        }
    ).then(r => !!r);
}

export function SetIndicateursMessage(messageId: string, starFlag: boolean, reReadFlag: boolean) {
    return omnivox.postJson<any>(
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
    return omnivox.postJson<any>(
        '/Mobl/Mio/DeleteMessage',
        {
            "Id": messageId,
            "SupprimerPermanent": false,
            "Envoie": false
        }
    ).then(r => !!r);
}

export function RestoreMessage(messageId: string) {
    return omnivox.postJson<any>(
        '/Mobl/Mio/RestoreMessage',
        {
            "Id": messageId,
            "Envoie": false
        }
    ).then(r => !!r);
}

export function SetMessageLu(messageId: string, isEnvoi = false) {
    return omnivox.postJson<any>(
        '/Mobl/Mio/SetMessageLu',
        {
            "Id": messageId,
            "IsEnvoi": isEnvoi
        }
    ).then(r => !!r);
}

export function RechercheIndividu(query: string) {
    return omnivox.postJson<MioSearch.IndividuItem[]>(
        '/Mobl/Mio/RechercheIndividu',
        { "TexteRecherche": query }
    );
}

export function AjoutCategorie(nomCategorie: string) {
    return omnivox.postJson<any>(
        '/Mobl/Mio/AjoutCategorie',
        {
            "nomCategorie": nomCategorie
        }
    ).then(r => !!r);
}

export function GetMioAttachment(messageId: string, attachmentId: string): Promise<DownloadResult> {
    const config = getConfig();
    const baseUrl = new URL(config.DefaultPage).origin;
    const qs = new URLSearchParams({
        IdMessage: messageId,
        IdAttachement: attachmentId,
    });

    return omnivox.download(`${baseUrl}/Mobl/Mio/GetAttachement?${qs.toString()}`);
}
