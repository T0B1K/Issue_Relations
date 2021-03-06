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
exports.sendLongCommentsRequest = exports.sendRequest = exports.isBlank = void 0;
var axios = require('axios');
/**
 * Checks if the string is undefined, blank or null
 * @param str the String being checked
 */
function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
exports.isBlank = isBlank;
/**
 * This function creates an github api address out of the given parameters
 *
 * @param user The user of the repository
 * @param repository The repository of the issue
 * @param issueID The id of the issue.
 * @param comments Whether the comments or the issue address should be created
 */
function createAddress(user, repository, issueID, comments) {
    if (isBlank(user))
        throw "no user was provided";
    if (isBlank(repository))
        throw "no repository was provided";
    if (isBlank(issueID))
        throw "no issueID was provided";
    var address = "https://api.github.com/repos/" + user + "/" + repository + "/issues/" + issueID;
    if (comments)
        return address + "/comments";
    return address;
}
/**
 * This function is used for sending requests
 *
 * @param node The node JSON from which the data is being provided
 * @param comments Whether the comments should be quarried or the issue itself
 */
function sendRequest(node, comments) {
    return __awaiter(this, void 0, void 0, function () {
        var address, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    address = createAddress(node.user, node.repository, "" + node.issueID, comments);
                    return [4 /*yield*/, axios.get(address)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
exports.sendRequest = sendRequest;
/**
 * This function is used for sending long requests (requests with 90 comments)
 * It automatically searches for new comments and scrapes them
 *
 * @param node The node JSON from which the data is being provided
 * @param comments Whether the comments should be quarried or the issue itself
 */
function sendLongCommentsRequest(node) {
    return __awaiter(this, void 0, void 0, function () {
        var address, page, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    address = createAddress(node.user, node.repository, "" + node.issueID, true), page = getGitHubPage(node.comments.length);
                    address = address + "?per_page=90&page=" + page;
                    console.log(address + "\n nr of comments: " + node.comments.length + "\tpage: " + page);
                    return [4 /*yield*/, axios.get(address)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
            }
        });
    });
}
exports.sendLongCommentsRequest = sendLongCommentsRequest;
/**
 * This function returns the next page to be crawled by the github api request
 *
 * @param numberOfComments The number of comments in the current request
 * @returns the next page to crawl
 */
function getGitHubPage(numberOfComments) {
    if (numberOfComments <= 0)
        return 0;
    else if (numberOfComments == 30)
        return 0;
    else
        return 1 + (numberOfComments / 90);
}
