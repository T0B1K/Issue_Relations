"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs_1 = require("fs");
var persARelation = [], persBRelation = [];
var fileA = "../issue_relations/data_participant_A.txt", fileB = "../issue_relations/data_participant_B.txt";
/**
 * This function opens a file.
 * firstFile decides whether the file is fileA or fileB
 *
 * @param firstFile decides whether it is fileA
 * @returns the buffered data
 */
function getDataFromFile(firstFile) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!firstFile) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs_1.promises.readFile(fileA, "utf8")];
                case 1:
                    data = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, fs_1.promises.readFile(fileB, "utf8")];
                case 3:
                    data = _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, Buffer.from(data)];
            }
        });
    });
}
/**
 * This function splits the document string into its rows and performs the function *createRelationsFromString*
 * on all the rows
 *
 * @param document The document containing the issue URL's and their relation
 * @param replacePatternA
 */
function createRelations(document, replacePatternA) {
    if (document === "")
        throw new Error("No documentname provided");
    var rows = document.split(/\s*\n/);
    rows.forEach(function (row) { return createRelationsFromString(row, replacePatternA); });
}
/**
 * This function splits the row into the two URL's and their relation, creates a RelationObject out of it and appends
 * it to either the persARelation or persBRelation
 *
 * @param row A string of the form urlA pattern urlB
 * @param replacePatternA used to switch between the two different patterns
 */
function createRelationsFromString(row, replacePatternA) {
    var tmp = [];
    if (replacePatternA) {
        row = row.replace(/\[\s*dup\s*\]/g, "<dupl.>");
        row = row.replace(/(\[|\])/g, "");
    }
    tmp = row.split(/\s*(\<\=\>|\=\>|\<\=|\<dupl.?\>|\n)\s*/);
    if (tmp.length < 3) {
        //Errors are unavoidable - instead of throwing an exception discard the row and log it
        console.error("formatting error with:");
        console.error(tmp);
    }
    else {
        var relData = { issueA: tmp[0], issueB: tmp[2], rel: checkForRelation(tmp[1]) };
        if (replacePatternA) {
            persBRelation.push(relData);
        }
        else {
            persARelation.push(relData);
        }
    }
}
/**
 * This function searches for the different string types and returns the number of the relation
 * <=> == 0; <dupl.> == 1; => == 2; <= == 3; -1 == not found
 *
 * @param str the relation in form of a string one of {=>, <=>, <dupl.>, <=}
 * @returns the relation number matching the relation
 */
function checkForRelation(str) {
    if (str === "")
        throw new Error("No relation-string provided");
    var relation = -1;
    if (str === "")
        return relation;
    if (str.match(/\<\=\>/))
        relation = 0;
    else if (str.match(/\<dupl/))
        relation = 1;
    else if (str.match(/\=\>/))
        relation = 2;
    else if (str.match(/\<\=/))
        relation = 3;
    return relation;
}
/**
 * This function iterates of the persARelation and persBRelation to search for instances
 * on which both URL's match. If this is the case, a tuple containing both relation numbers is created.
 * The list of all the tuples gets returned
 *
 * @returns list of matches
 */
function matchRelations() {
    if (persARelation.length == 0 || persBRelation.length == 0)
        return [];
    var matches = [];
    for (var _i = 0, persBRelation_1 = persBRelation; _i < persBRelation_1.length; _i++) {
        var otherRelation = persBRelation_1[_i];
        for (var _a = 0, persARelation_1 = persARelation; _a < persARelation_1.length; _a++) {
            var myRelation = persARelation_1[_a];
            if (otherRelation.issueA == myRelation.issueA && otherRelation.issueB == myRelation.issueB) {
                var match = [otherRelation.rel, myRelation.rel];
                matches.push(match);
                break;
            }
        }
    }
    return matches.filter(function (x) { return x[0] != -1 && x[1] != -1; });
}
/**
 * This function calculates the kappa based on the numbers
 * Throws an error, if the input doesn't match the correct form.
 *
 * @param matches The matches (list of relation numbers) in list of documents
 */
function calcKappa(matches) {
    if (matches.length == 0 || matches.map(function (m) { return m.length; }).filter(function (m) { return m != 2; }).length > 0)
        throw new Error("wrong array shape should be 2D with 2 cols and multiple rows");
    var classes = 4, m = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], agreement = 0, total = 0, personAclasses = [0, 0, 0, 0], personBclasses = [0, 0, 0, 0];
    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
        var match = matches_1[_i];
        var m0 = match[0], m1 = match[1];
        if (m0 == -1 || m1 == -1) //one of the votes is invalid
            continue;
        if (m0 == m1) //both votes are the same
            agreement++;
        personAclasses[m0]++;
        personBclasses[m1]++;
        total++; //total <= relations.length because of invalids
        m[m0][m1]++;
    }
    agreement /= total;
    var p_e = calculatePE(classes, [personAclasses, personBclasses], total);
    console.info("\n\ntotal: " + total + "\tagreement: " + agreement + "\nkappa: " + (agreement - p_e) / (1 - p_e) + "\tfor " + total + " issues");
    console.info("<=> : " + personAclasses[0] + "\t<dupl.> : " + personAclasses[1] + "\t=> : " + personAclasses[2] + "\t<= :" + personAclasses[3] + "\t");
}
/**
 * This function calculates the p_e value of the kappa
 * @param classes number of classes
 * @param personClasses classes for both participants
 * @param total total amount of issues
 * @returns p_e
 */
function calculatePE(classes, personClasses, total) {
    if (classes < 1)
        throw new Error("No class provided - There has to be at least one class");
    var p_e = 0;
    for (var c = 0; c < classes; c++) {
        p_e = (personClasses[0][c] / total) * (personClasses[1][c] / total);
    }
    return p_e;
}
// after the files have been opened calculate the kappa
Promise.all([getDataFromFile(true), getDataFromFile(false)])
    .then(function (data) {
    var fileAdata = data[0].toString(), fileBdata = data[1].toString();
    createRelations(fileAdata, false); //create the relations
    createRelations(fileBdata, true);
    var matches = matchRelations();
    calcKappa(matches); //calculate the kappa
});
