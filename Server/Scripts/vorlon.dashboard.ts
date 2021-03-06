﻿import express = require("express");
import http = require("http");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
import fs = require("fs");
import path = require("path");

//Vorlon
import iwsc = require("./vorlon.IWebServerComponent");
import ws = require("./vorlon.webServer");
import vauth = require("./vorlon.authentication");
import baseURLConfig = require("../config/vorlon.baseurlconfig"); 

export module VORLON {
    export class Dashboard implements iwsc.VORLON.IWebServerComponent {
        
        private baseURLConfig: baseURLConfig.VORLON.BaseURLConfig;
        
        constructor() {
            this.baseURLConfig = new baseURLConfig.VORLON.BaseURLConfig();           
        }

        public addRoutes(app: express.Express, passport: any): void {
            app.route(this.baseURLConfig.baseURL + '/').get(vauth.VORLON.Authentication.ensureAuthenticated, this.defaultDashboard());
            app.route(this.baseURLConfig.baseURL + '/dashboard').get(vauth.VORLON.Authentication.ensureAuthenticated,this.defaultDashboard());
            app.route(this.baseURLConfig.baseURL + '/dashboard/').get(vauth.VORLON.Authentication.ensureAuthenticated,this.defaultDashboard());

            app.route(this.baseURLConfig.baseURL + '/dashboard/:sessionid').get(vauth.VORLON.Authentication.ensureAuthenticated,this.dashboard());
            app.route(this.baseURLConfig.baseURL + '/dashboard/:sessionid/reset').get(vauth.VORLON.Authentication.ensureAuthenticated,this.dashboardServerReset());
            app.route(this.baseURLConfig.baseURL + '/dashboard/:sessionid/:clientid').get(vauth.VORLON.Authentication.ensureAuthenticated,this.dashboardWithClient());
            
            //login
            app.post(this.baseURLConfig.baseURL + '/login',   
                    passport.authenticate('local', 
                        { failureRedirect: '/login',
                          successRedirect: '/',
                          failureFlash: false })
                );
            
           app.route(this.baseURLConfig.baseURL + '/login').get(this.login);  
           
           app.get(this.baseURLConfig.baseURL + '/logout', this.logout);
        }

        public start(httpServer: http.Server): void {
            //Not implemented
        }

        //Routes
        private defaultDashboard() {
            return (req: express.Request, res: express.Response) => {
                res.redirect(this.baseURLConfig.baseURL + '/dashboard/default');
            };
        }

        private dashboard() {
            return (req: express.Request, res: express.Response) => {
                var authent = false;
                var configastext = fs.readFileSync(path.join(__dirname, "../config.json"));
                var catalog = JSON.parse(configastext.toString().replace(/^\uFEFF/, ''));   
                
                if(catalog.activateAuth){
                    authent = catalog.activateAuth;
                }
                
                console.log(authent);
                res.render('dashboard', { baseURL: this.baseURLConfig.baseURL, title: 'Dashboard', sessionid: req.params.sessionid, clientid: "", authenticated: authent });
            }
        }


        private dashboardWithClient() {
            return (req: express.Request, res: express.Response) => {
                res.render('dashboard', { baseURL: this.baseURLConfig.baseURL, title: 'Dashboard', sessionid: req.params.sessionid, clientid: req.params.clientid });
            }
        }

        private getsession(req: express.Request, res: express.Response) {
            res.render('getsession', { title: 'Get Session' });
        }
        
        private login(req: express.Request, res: express.Response) {
             this.baseURLConfig = new baseURLConfig.VORLON.BaseURLConfig();       
            res.render('login', {  baseURL: this.baseURLConfig.baseURL, message: 'Please login' });
        }
        
        private logout(req: any, res: any) {
            req.logout();
            res.redirect('/');
        }

        private dashboardServerReset() {
            return (req: any, res: any) => {
                var sessionid = req.params.sessionid;
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            res.send("Done.");
                        }
                    }
                }
    
                xhr.open("GET", "http://" + req.headers.host + this.baseURLConfig.baseURL + "/api/reset/" + sessionid);
                xhr.send();
            }
        }
    }
};
