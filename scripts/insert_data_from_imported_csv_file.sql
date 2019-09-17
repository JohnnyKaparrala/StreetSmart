INSERT INTO [occurrences_index] (
   minLng,
   maxLng,
   minLat,
   maxLat
)
SELECT 
Temp.LONGITUDE as LONGITUDE,
Temp.LONGITUDE as LONGITUDE,
Temp.LATITUDE as LATITUDE,
Temp.LATITUDE as LATITUDE
FROM Temp
WHERE
NOT EXISTS (SELECT 1 FROM OCCURRENCES WHERE 
OCCURRENCES.BO_NUMBER = Temp.NUM_BO AND 
OCCURRENCES.BO_YEAR = Temp.ANO_BO AND
OCCURRENCES.POLICE_STATION_NAME = Temp.DELEGACIA_NOME)
GROUP BY ANO_BO, NUM_BO, DELEGACIA_NOME;

INSERT INTO [occurrences] (
                       BO_YEAR,
                       BO_NUMBER,
                       BO_BEGIN_TIME,
                       BO_EMISSION_TIME,
                       DATE,
                       PERIOD,
                       IS_FLAGRANT,
                       ADDRESS_STREET,
                       ADDRESS_NUMBER,
                       ADDRESS_DISTRICT,
                       ADDRESS_CITY,
                       ADDRESS_STATE,
                       LATITUDE,
                       LONGITUDE,
                       PLACE_DESCRIPTION,
                       POLICE_STATION_NAME,
                       POLICE_STATION_CIRCUMSCRIPTION,
                       RUBRIC,
                       FATAL_VICTIM,
                       PERSON_SEX,
                       PERSON_AGE,
                       PERSON_SKIN_COLOR,
                       LINKED_NATURE
                   )
SELECT Temp.ANO_BO,
Temp.NUM_BO,
Temp.BO_INICIADO,
Temp.BO_EMITIDO,
Temp.DATAOCORRENCIA,
Temp.PERIDOOCORRENCIA,
Temp.FLAGRANTE,
Temp.LOGRADOURO,
Temp.NUMERO,
Temp.BAIRRO,
Temp.CIDADE,
Temp.UF,
Temp.LATITUDE,
Temp.LONGITUDE,
Temp.DESCRICAOLOCAL,
Temp.DELEGACIA_NOME,
Temp.DELEGACIA_CIRCUNSCRICAO,
Temp.RUBRICA,
Temp.VITIMAFATAL,
Temp.SEXO,
Temp.IDADE,
Temp.CORCUTIS,
Temp.NATUREZAVINCULADA
FROM Temp
WHERE
NOT EXISTS (SELECT 1 FROM OCCURRENCES WHERE 
OCCURRENCES.BO_NUMBER = Temp.NUM_BO AND 
OCCURRENCES.BO_YEAR = Temp.ANO_BO AND
OCCURRENCES.POLICE_STATION_NAME = Temp.DELEGACIA_NOME)
GROUP BY ANO_BO, NUM_BO, DELEGACIA_NOME;

DROP TABLE Temp;