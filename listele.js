var Firebird = require('node-firebird');
let fs = require('fs');
const { parse } = require('querystring');
const transliteration = require('transliteration');

/*const express = require('express');
const path = require('path');
const ejs = require('ejs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const app = express();


app.set("view engine", "ejs");*/


var options = {};

options.host = 'localhost';
options.port = 3050;
options.database = 'C://Users//StjEsat.Kosedag//Desktop//data//31.12.2022//kmc2017.fdb';
options.user = 'SYSDBA';
options.password = 'masterkey';
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null;            // default
options.pageSize = 4096;        // default when creating database
options.retryConnectionInterval = 1000; // reconnect interval in case of connection drop
options.blobAsText = false; // set to true to get blob as text, only affects blob subtype 1

'use strict';
/*function callStokAsilVeriler() {
    

}*/
let obj = {
    machineInformation: []
};

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

var qyr = "SELECT S.MIKTAR1,S.SABIT_MALIYET,I.ISLEM_NOKTASI_NO,I.ISLEM_NOKTASI_ADI,A.STOK_ISLEMA_NO,A.ISLEM_ADI,A.DURUM,SK.STOK_ADI,COALESCE (AD.ALISSATIS_NO,NULL,'-- --') SIPARIS_NO, SUM(IIF (S2.ISLEM_KODU='STKÜRG', S2.MIKTAR1,0))/S.MIKTAR1 FROM STOKASIL A LEFT JOIN STOKASIL A2 ON A2.TAKIP_NO=A.TAKIP_NO AND A2.STOK_ISLEMA_NO<>A.STOK_ISLEMA_NO LEFT JOIN STOKISLM S2 ON S2.STOK_ISLEMA_NO=A2.STOK_ISLEMA_NO JOIN STOKISLM S ON S.STOK_ISLEMA_NO=A.STOK_ISLEMA_NO JOIN STOKKART SK ON SK.STOK_NO=S.STOK_NO JOIN ABC_ISEMASIL IA ON IA.ISLEM_NO=A.STOK_ISLEMA_NO JOIN ABC_ISEMDETA D ON D.ISLEM_NO=A.STOK_ISLEMA_NO JOIN ISLMNOKT I ON I.ISLEM_NOKTASI_NO=A.GIRIS_ISLEM_NOKTASI_NO LEFT JOIN STOKALSA SA ON SA.STOK_ISLEM_NO=S.STOK_ISLEM_NO LEFT JOIN ALSADETA AD ON AD.ALISSATIS_DETAY_NO=SA.ALISSATIS_DETAY_NO WHERE A.TAKIP_NO LIKE 'IE%' AND A.TARIH BETWEEN '01.11.2022' AND '21.12.2022' AND S.ISLEM_KODU='STKÜRG' AND I.SAYI5=35  AND A.DURUM <> 'Tamamlandı' GROUP BY I.ISLEM_NOKTASI_NO,I.ISLEM_NOKTASI_ADI,A.STOK_ISLEMA_NO,A.ISLEM_ADI,A.DURUM,AD.ALISSATIS_NO,S.MIKTAR1,A.ACIKLAMA,S.SABIT_MALIYET,SK.STOK_ADI";
var qyr2 = "select  distinct A.DURUM from ISLMONAY A WHERE A.KOD_TURU='STOK'";
var qyr3 = 'SELECT * FROM ABC_VARDASIL';


let finalOutput = [];

module.exports = Firebird.attach(options, function (err, database) {
    if (err) {
        throw err;
    } else {
        db = database; // Veritabanı bağlantısını db değişkenine ata
        console.log('Veri Tabanı Bağlantısı Başarılı');

        // İki sorguyu aynı işlem içinde çalıştırmak için transaction kullanımı
        db.transaction(
            Firebird.ISOLATION_READ_COMMITED, // İstenen izolasyon seviyesini seçin
            function (err, transaction) {
                if (err) throw err;

                transaction.query(qyr, function (err, result1) {
                    if (err) {
                        throw err;
                    } else {
                        console.log('İlk sorgu sonuçları:', result1);
                        var idCounter = 1;
                        var idMap = {};

                        result1.forEach(function (item) {
                            if (!idMap[item.ISLEM_NOKTASI_ADI]) {
                                idMap[item.ISLEM_NOKTASI_ADI] = idCounter;
                                finalOutput.push({
                                    id: idCounter,
                                    title: item.ISLEM_NOKTASI_ADI,
                                    STOK_ISLEMA_NO: null,
                                    start: '2023-07-24T12:16:00.000Z',
                                    end: '2023-07-30T15:57:00.000Z',
                                    miktar: item.MIKTAR1,
                                    maliyet: item.SABIT_MALIYET,
                                    ISLEM_ADI: item.ISLEM_ADI,
                                    DURUM: transliteration
                                        .transliterate(item.DURUM)
                                        .toLowerCase(),
                                    SIPARIS_NO: item.SIPARIS_NO,
                                    DIVIDE: item.DIVIDE,
                                    parentId: 0,
                                });
                                idCounter++;
                            }

                            finalOutput.push({
                                id: idCounter,
                                title: item.STOK_ISLEMA_NO.toString() + ' Nolu İş Emri',
                                STOK_ISLEMA_NO: item.STOK_ISLEMA_NO,
                                start: '2023-07-24T12:16:00.000Z',
                                end: '2023-07-30T15:57:00.000Z',
                                ISLEM_ADI: item.ISLEM_ADI,
                                DURUM: item.DURUM,
                                miktar: item.MIKTAR1,
                                maliyet: item.SABIT_MALIYET,
                                SIPARIS_NO: item.SIPARIS_NO,
                                uretilecekUrun: item.STOK_ADI,
                                DIVIDE: item.DIVIDE,
                                calisanMakine: item.ISLEM_NOKTASI_ADI,
                                parentId: idMap[item.ISLEM_NOKTASI_ADI],
                            });
                            idCounter++;
                        });

                        transaction.query(qyr2, function (err, result2) {
                            if (err) {
                                throw err;
                            } else {
                                console.log('İkinci sorgu sonuçları:', result2);

                                transaction.query(qyr3, function (err, result3) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        console.log('Üçüncü sorgu sonuçları:', result3);

                                        fs.writeFile(
                                            'C://Users//StjEsat.Kosedag//Desktop//PCAT//public//js//mydata.js',
                                            'window.machineInformation = ' + JSON.stringify(finalOutput, null, 2),
                                            function (err) {
                                                // ... (diğer işlemler)
                                            }
                                        );

                                        fs.writeFile(
                                            'C://Users//StjEsat.Kosedag//Desktop//PCAT//public//js//mydata2.js',
                                            'window.machineInformation2 = ' + JSON.stringify(result2, null, 2),
                                            function (err) {
                                                // ... (diğer işlemler)
                                            }
                                        );

                                        fs.writeFile(
                                            'C://Users//StjEsat.Kosedag//Desktop//PCAT//public//js//mydata3.js',
                                            'window.machineInformation3 = ' + JSON.stringify(result3, null, 2),
                                            function (err) {
                                                // ... (diğer işlemler)
                                            }
                                        );

                                        console.log('Transaction başarıyla tamamlandı.');



                                        db.detach(); // Veritabanı bağlantısını kapat

                                    }
                                });
                            }
                        });
                    }
                });
            }
        );
    }
});

;

//callStokAsilVeriler();


