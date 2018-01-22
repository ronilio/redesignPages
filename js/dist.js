'use strict';

angular.module('ilWebClient', [/*'ngRaven',*/ 'ngMaterial', 'material.components.expansionPanels', 'ui.router', 'md.data.table', 'config', 'messages', 'restangular', 'ngMessages', 'angularMoment', 'ngSanitize', 'NotificationModule', 'ngFileUpload', 'ngIdle', 'angular-inview', 'as.sortable', 'ngCookies', 'angular-date-picker-polyfill', 'mgo-angular-wizard', 'cl-paging']);

angular.module('ilWebClient').config(['$stateProvider', '$urlRouterProvider', 'RestangularProvider', 'API_URL', '$httpProvider', 'ROLES', 'COMPONENTS', '$compileProvider', function ($stateProvider, $urlRouterProvider, RestangularProvider, API_URL, $httpProvider, ROLES, COMPONENTS, $compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|itms-services):/);
        
        // $urlRouterProvider.when('/app', '/app/dashboard/assets');
        // $urlRouterProvider.when('/app/dashboard', '/app/dashboard/assets');
        $urlRouterProvider.otherwise("/login");


        $httpProvider.interceptors.push('authInterceptor');
        $httpProvider.defaults.withCredentials = true;

        window.onkeydown = function (event) {
            if (event.which == 8 && ['text', 'textarea', 'search', 'email', 'password', 'url', 'number'].indexOf(event.target.type) == -1) {
                event.preventDefault();
            }
        };
        $stateProvider
            .state('resetPassword', {
                url: "/resetPassword?token",
                views: {
                    'main': {
                        templateUrl: "js/password-management/password-management.html",
                        controller: 'PasswordManagementController'
                    }
                }
            })
            .state('register', {
                url: "/register?token",
                views: {
                    'main': {
                        templateUrl: "js/password-management/password-management.html",
                        controller: 'PasswordManagementController'
                    }
                }
            })
            .state('login', {
                url: "/login",
                views: {
                    'main': {
                        templateUrl: "js/login/login.html",
                        controller: 'LoginController'
                    }
                }
            })
            .state('main.user', {
                url: "/user",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD, ROLES.HCL, ROLES.PER],
                views: {
                    "content@main": {
                        templateUrl: "js/user/user.html",
                        controller: "UserController"
                    }
                }
            })
            .state('main.gateway', {
                url: "/gateway",
                authenticate: true,
                acceptedRoles: [ROLES.SAD],
                views: {
                    "content@main": {
                        templateUrl: "js/gateway/gateway.html",
                        controller: "GatewayController"
                    }
                }
            })
            .state('main.dictionary', {
                url: "/dictionary",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD],
                views: {
                    "content@main": {
                        templateUrl: "js/dictionary/dictionary.html",
                        controller: "DictionaryController"
                    }
                }
            })
            .state('main.flow', {
                url: "/flow",
                requiredComponents: [COMPONENTS.PTRAK],
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD],
                views: {
                    "content@main": {
                        templateUrl: "js/flow/flow.html",
                        controller: "FlowController"
                    }
                }
            })
            .state('main.beacon', {
                url: "/beacon",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD],
                views: {
                    "content@main": {
                        templateUrl: "js/beacon/beacon.html",
                        controller: "BeaconController"
                    }
                }
            })
            .state('main.room', {
                url: "/room",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD],
                views: {
                    "content@main": {
                        templateUrl: "js/room/room.html",
                        controller: "RoomController"
                    }
                }
            })
            .state('main.floor', {
                url: "/floor",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD],
                views: {
                    "content@main": {
                        templateUrl: "js/floor/floor.html",
                        controller: "FloorController"
                    }
                }
            })
            .state('main.editFloor', {
                url: "/edit-floor?floor",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD],
                views: {
                    "content@main": {
                        templateUrl: "js/floor/create.html",
                        controller: "FloorEditController"
                    }
                },
                params: {'floor': ''},
            })
            .state('main.survey', {
                url: "/survey",
                authenticate: true,
                requiredComponents: [COMPONENTS.PTRAK],
                acceptedRoles: [ROLES.SAD],
                views: {
                    "content@main": {
                        templateUrl: "js/survey/survey.html",
                        controller: "SurveyController"
                    }
                }
            })
            .state('main.metrics', {
                url: "/metrics",
                authenticate: true,
                acceptedRoles: [ROLES.SAD],
                views: {
                    "content@main": {
                        templateUrl: "js/metrics/metrics.html",
                        controller: "MetricsController",
                        controllerAs: 'vm'
                    }
                }
            });
        RestangularProvider.setBaseUrl(API_URL);
    }])
    .factory('authInterceptor', ['$q', '$window', '$injector', function ($q, $window, $injector) {
        return {
            // Add authorization token to headers
            request: function (config) {
                config.headers = config.headers || {};
                var token = $window.localStorage.getItem('token');
                if (token) {
                    config.headers['X-Auth-Token'] = token;
                }
                return config;
            },
            responseError: function (rejection) {
                if (rejection.status == 401) {
                    // Raven.captureMessage('User logged out on interceptor: ' + JSON.stringify(rejection));
                    $window.localStorage.clear();
                    $window.localStorage.setItem('notify-token-expired', true);
                    $window.location.replace("#/login");
                }
                if (rejection.status == -1 && $window.navigator.onLine) {
                    // Raven.captureMessage('User timeout issue: ' + JSON.stringify(rejection));
                    $injector.get('NotificationService').show('You are experiencing network issues. Some requests may fail.', 'error');
                }
                if (!$window.navigator.onLine) {
                    // Raven.captureMessage('User offline issue: ' + JSON.stringify(rejection));
                    $injector.get('NotificationService').show('You appear to be offline please check your internet connection', 'error');
                }
                return $q.reject(rejection);
            }
        }
    }])
    .config(["IdleProvider", "KeepaliveProvider", function (IdleProvider, KeepaliveProvider) {
        // configure Idle settings
        IdleProvider.idle(10 * 60); // in seconds
        IdleProvider.timeout(20 * 60); // in seconds
        KeepaliveProvider.interval(5 * 60); // in seconds
        KeepaliveProvider.http('/api/heartbeat/'); // URL to check if session is alive
    }])
    .run(["Idle", function (Idle) {
        // start watching when the app runs. also starts the Keepalive service by default.
        Idle.watch();

        // TOOD: check if we already include a polyfill for this
        if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(elt /*, from*/)
        {
            var len = this.length >>> 0;

            var from = Number(arguments[1]) || 0;
            from = (from < 0)
                ? Math.ceil(from)
                : Math.floor(from);
            if (from < 0)
            from += len;

            for (; from < len; from++)
            {
            if (from in this &&
                this[from] === elt)
                return from;
            }
            return -1;
        };
    }
    }])
    .config(['TitleProvider', function (TitleProvider) {
        TitleProvider.enabled(false); // it is enabled by default
    }])
    .run(['$rootScope', '$state', 'UserService', '$window', 'NotificationService', function ($rootScope, $state, UserService, $window, NotificationService) {
        $rootScope.getTitle = function(){
            return $window.localStorage.getItem('title');
        };
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
            if (toState.authenticate && !UserService.isAuthenticated()) {
                // User isn’t authenticated
                $window.localStorage.clear();
                $state.transitionTo("login");
                event.preventDefault();
            }
            if (toState.requiredComponents) {
                var hospitalPermissions = UserService.getHospitalPermissions();
                var permissions = toState.requiredComponents.filter(function (value) {
                    return hospitalPermissions[value];
                });
                if (permissions.length === 0) {
                    $state.transitionTo("main");
                    NotificationService.show('You don\'t have this functionality attached to your hospital\'s component', 'error');
                    event.preventDefault();
                    return;
                }
            }
            if (toState.acceptedRoles) {
                var userRoles = UserService.getRolesArray();
                var rolesIntersection = toState.acceptedRoles.filter(function (value) {
                    return userRoles.indexOf(value) > -1;
                });
                if (rolesIntersection.length === 0) {
                    // User doesn't have any permission on this state
                    $window.localStorage.clear();
                    $state.transitionTo("login");
                    event.preventDefault();
                }
            }
        });
    }]);

var devOrigin = 'http://localhost:3000';
var devServer = 'https://hospital1-qa.intelligentlocations.io';


angular.module('config', [])
    .constant('API_URL', devServer + '/api')
    .constant('SOCKET_URL', devServer + '/api/websocket/connect')
    .constant('SOCKET_TOPICS', {
        ALLOCATION: '/api/topic/beacon_allocation/',
        ALLOCATION_ASSETS: '/api/topic/beacon_allocation/ASSET/',
        ALLOCATION_PATIENTS: '/api/topic/beacon_allocation/PATIENT/',
        ALLOCATION_COUNT: '/api/topic/beacon/count/',
        GATEWAY: '/api/topic/gateway/'
    })
    .constant('ROLES', {
        SAD: 'Super Admin',
        HAD: 'Hospital Admin',
        HCL: 'Hospital Clerk',
        PER: 'Personnel',
        GPER: 'Generic Personnel' // TODO check name after backend implementation
    })
    .constant("GATEWAY_STATUSES", {
        CHANGING_TENANT: "CHANGING TENANT",
        PENDING: "PENDING",
        RESTARTING: "RESTARTING",
        UNAVAILABLE: "UNAVAILABLE",
        NO_SIGNAL: "NO SIGNAL",
        DISABLED: "DISABLED",
        RUNNING: "RUNNING",
        UNFLASHED: "UNFLASHED"
    })
    .constant("GATEWAY_BT_STATUSES",{
        PENDING: "PENDING",
        UP: "UP",
        DOWN: "DOWN",
        HW_FAIL: "HW FAIL",
        UNKNOWN: "UNKNOWN"
    })
    .constant('COMPONENTS', {
        ATRAK: 'atrak',
        PTRAK: 'ptrak'
    })
    .constant('FEATURE_TYPES', {
        ROOM: 'ROOM',
    });

'use strict';
angular.module('messages', [])
    .constant("MSG", {
        FORM_UPDATE_DISCLAIMER: "* All references will be updated",
        DEFAULT_FILE_UPLOAD_ERR: "File upload failed",
        USER_ACC_LOCKED: "Your account has been locked after several failed login attempts. Try again later or reset your password.",
        REQUEST_TIMEOUT: "The server is unreachable right now. Please make sure you have an active internet connection",
        URL_CHECK_FAILED: "There seems to be an issue with your URL",
        EMAIL_SENT_CONFIRMATION: "We have sent you an email with instructions to reset your password",
        PWD_SET_CONFIRMATION: "Password set successfully",
        PWD_SET_ERR: "We will send you an email with instructions to reset your password if the provided email address is registered into our system"
    });

angular.module("templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("js/beacon/beacon-selection.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap ng-if=\"ROLES.SAD\">\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"model.hospital\"\n                            md-search-text=\"searchTextHospitals\"\n                            md-items=\"option in querySearch(searchTextHospitals, hospitals, \'name\')\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            required=\"true\"\n                            md-floating-label=\"Hospital\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No hospitals found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"proceed()\">Next</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/beacon/beacon.html","<crud-list\n        resource=\"beacon\"\n        columns=\"columns\"\n        filter-config=\"filterConfig\"\n        create-form-url=\"js/beacon/create.html\"\n        form-options=\"formOptions\"\n        intermediate-template=\"js/beacon/beacon-selection.html\"\n        intermediate-controller=\"BeaconIntermediaryController\"\n        actions=\"actions\"></crud-list>");
$templateCache.put("js/beacon/create.html","<md-dialog flex=\"40\" flex-md=\"55\" flex-sm=\"100\" flex-xs=\"100\" layout-padding>\n    <form name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <div layout=\"row\" layout-wrap>\n                    <md-input-container flex=\"auto\">\n                        <label>Select protocol</label>\n                        <md-select ng-model=\"model.beaconType\">\n                            <md-option disabled ng-if=\"beaconTypes.length == 0\">No items available</md-option>\n                            <md-option ng-repeat=\"beaconType in beaconTypes\" ng-value=\"beaconType\">\n                                {{beaconType}}\n                            </md-option>\n                        </md-select>\n                    </md-input-container>\n                </div>\n\n                <div ng-if=\"beaconTypes.length != 0\">\n                    <div class=\"ng-cloak\" ng-if=\"model.beaconType.toLowerCase() == \'ibeacon\'\" ng-include=\"\'js/beacon/ibeacon.html\'\"></div>\n                    <div class=\"ng-cloak\" ng-if=\"model.beaconType.toLowerCase() == \'nearable\'\" ng-include=\"\'js/beacon/nearable.html\'\"></div>\n                </div>\n\n            </div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid || beaconTypes.indexOf(model.beaconType) == -1\" ng-click=\"save()\"> Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/beacon/ibeacon.html","<div layout=\"column\" layout-padding layout-margin>\n\n    <md-input-container>\n        <label>Name</label>\n        <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"60\" minlength=\"4\">\n        <div ng-messages=\"form.name.$error\" ng-show=\"form.name.$dirty && form.name.$invalid\">\n            <div ng-message=\"required\">This is required!</div>\n            <div ng-message=\"md-maxlength\">That\'s too long!</div>\n            <div ng-message=\"minlength\">That\'s too short!</div>\n        </div>\n    </md-input-container>\n\n    <md-input-container class=\"styled-placeholder\">\n        <label>UUID</label>\n        <input name=\"uuid\" ng-model=\"model.uuid\" md-maxlength=\"45\" minlength=\"10\" placeholder=\"This value is used for proximity tracking on mobile app\">\n        <div ng-messages=\"form.uuid.$error\" ng-if=\"form.uuid.$dirty && form.uuid.$invalid\" role=\"alert\">\n            <div ng-message=\'required\'>This is required!</div>\n            <div ng-message=\'md-maxlength\'>That\'s too long!</div>\n            <div ng-message=\"minlength\">That\'s too short!</div>\n        </div>\n        <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n            <div ng-repeat=\"errorText in validationErrors[\'Beacon.uuid\']\">\n                {{ errorText }}\n            </div>\n        </div>\n    </md-input-container>\n\n    <md-input-container>\n        <label>MAC Address</label>\n        <input name=\"macAddress\" ng-model=\"model.macAddr\" required md-maxlength=\"45\" minlength=\"10\">\n        <div ng-messages=\"form.macAddress.$error\" ng-if=\"form.macAddress.$dirty && form.macAddress.$invalid\" role=\"alert\">\n            <div ng-message=\'required\'>This is required!</div>\n            <div ng-message=\'md-maxlength\'>That\'s too long!</div>\n            <div ng-message=\"minlength\">That\'s too short!</div>\n        </div>\n        <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n            <div ng-repeat=\"errorText in validationErrors[\'Beacon.macAddr\']\">\n                {{ errorText }}\n            </div>\n        </div>\n    </md-input-container>\n\n    <md-autocomplete\n            ng-if=\"ROLES.SAD && !model.overrideTemplate && isEditMode\"\n            ng-disabled=\"true\"\n            md-no-cache=\"true\"\n            md-selected-item=\"model.hospital\"\n            md-search-text=\"searchTextHospital\"\n            md-items=\"option in querySearch(searchTextHospital, formOptions.hospitals, \'name\')\"\n            md-item-text=\"option.name\"\n            md-min-length=\"0\"\n            required=\"true\"\n            md-floating-label=\"Hospital\">\n        <md-item-template>\n            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n        </md-item-template>\n        <md-not-found>\n            No hospitals found\n        </md-not-found>\n    </md-autocomplete>\n\n</div>");
$templateCache.put("js/beacon/nearable.html","<div layout=\"column\" layout-padding layout-margin>\n\n    <md-input-container>\n        <label>Name</label>\n        <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"60\" minlength=\"4\">\n        <div ng-messages=\"form.name.$error\" ng-show=\"form.name.$dirty && form.name.$invalid\">\n            <div ng-message=\"required\">This is required!</div>\n            <div ng-message=\"md-maxlength\">That\'s too long!</div>\n            <div ng-message=\"minlength\">That\'s too short!</div>\n        </div>\n    </md-input-container>\n\n    <md-input-container class=\"styled-placeholder\">\n        <label>UUID</label>\n        <input name=\"uuid\" ng-model=\"model.uuid\" md-maxlength=\"45\" minlength=\"10\" placeholder=\"This value is used for proximity tracking on mobile app\">\n        <div ng-messages=\"form.uuid.$error\" ng-if=\"form.uuid.$dirty && form.uuid.$invalid\" role=\"alert\">\n            <div ng-message=\'required\'>This is required!</div>\n            <div ng-message=\'md-maxlength\'>That\'s too long!</div>\n            <div ng-message=\"minlength\">That\'s too short!</div>\n        </div>\n        <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n            <div ng-repeat=\"errorText in validationErrors[\'Beacon.uuid\']\">\n                {{ errorText }}\n            </div>\n        </div>\n    </md-input-container>\n\n    <md-input-container>\n        <label>Identifier</label>\n        <input name=\"nearableUUID\" ng-model=\"model.nearableUUID\" required md-maxlength=\"45\" minlength=\"10\">\n        <div ng-messages=\"form.nearableUUID.$error\" ng-if=\"form.nearableUUID.$dirty && form.identifier.$invalid\" role=\"alert\">\n            <div ng-message=\'required\'>This is required!</div>\n            <div ng-message=\'md-maxlength\'>That\'s too long!</div>\n            <div ng-message=\"minlength\">That\'s too short!</div>\n        </div>\n        <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n            <div ng-repeat=\"errorText in validationErrors[\'Beacon.nearableUUID\']\">\n                {{ errorText }}\n            </div>\n        </div>\n    </md-input-container>\n\n    <md-autocomplete\n            ng-if=\"ROLES.SAD && !model.overrideTemplate && isEditMode\"\n            ng-disabled=\"true\"\n            md-no-cache=\"true\"\n            md-selected-item=\"model.hospital\"\n            md-search-text=\"searchTextHospital\"\n            md-items=\"option in querySearch(searchTextHospital, formOptions.hospitals, \'name\')\"\n            md-item-text=\"option.name\"\n            md-min-length=\"0\"\n            md-floating-label=\"Hospital\"\n            required=\"true\">\n        <md-item-template>\n            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n        </md-item-template>\n        <md-not-found>\n            No hospitals found\n        </md-not-found>\n    </md-autocomplete>\n\n</div>");
$templateCache.put("js/crud/list.html","<div layout=\"row\">\n    <div ng-if=\"filterConfig != undefined\" flex=\"30\" flex-md=\"40\" layout-padding class=\"md-whiteframe-6dp free-text-search-form filter-area spacing-right search-form\">\n        <div layout=\"row\" flex-xs-auto=\"\">\n            <span class=\"searchLabelColor\" layout-margin>SEARCH</span>\n            <span flex></span>\n            <md-button class=\"filter-button reset\" ng-click=\"resetSearch()\">\n                Reset\n            </md-button>\n            <md-button class=\"filter-button\" ng-click=\"search(search.text)\">\n                Apply\n            </md-button>\n        </div>\n\n        <div class=\"input\" layout-margin>\n            <md-input-container md-no-float layout=\"row\" class=\"searchBarWidth\">\n                <i class=\"zmdi zmdi-search zmdi-hc-2x\"></i>\n                <input name=\"text\" ng-model=\"search.text\" placeholder=\"Search...\"/>\n            </md-input-container>\n        </div>\n    </div>\n\n    <div ng-if=\"filterConfig != undefined\" flex=\"70\" flex-md=\"60\" layout-padding class=\"md-whiteframe-6dp filter-area spacing-left\">\n        <div layout=\"row\">\n            <span class=\"filterPadding\">FILTER</span>\n            <span flex></span>\n            <md-button class=\"filter-button reset\" ng-click=\"resetFilters()\">\n                Reset\n            </md-button>\n            <md-button class=\"filter-button\" ng-click=\"applyFilters()\">\n                Apply\n            </md-button>\n        </div>\n        <div layout=\"row\">\n        <span ng-repeat=\"filter in filterConfig\" flex>\n            <span ng-switch=\"filter.type\" layout=\"row\">\n                <md-input-container ng-switch-when=\"select\" layout-fill>\n                    <span ng-switch=\"filter.allowMultipleSelection\">\n                        <label>{{filter.placeholder}}</label>\n                        <md-select ng-switch-when=\"true\" ng-model=\"activeSelectionFilters[filter.column]\" multiple>\n                            <md-option disabled ng-if=\"filter.values.length == 0\">No items available</md-option>\n                            <md-option ng-repeat=\"option in filter.values\" value=\"{{option.value}}\">\n                                {{option.name}}\n                            </md-option>\n                        </md-select>\n                        <md-select ng-switch-default ng-model=\"activeSelectionFilters[filter.column]\">\n                            <md-option disabled ng-if=\"filter.values.length == 0\">No items available</md-option>\n                            <md-option ng-repeat=\"option in filter.values\" value=\"{{option.value}}\">\n                                {{option.name}}\n                            </md-option>\n                        </md-select>\n                    </span>\n                </md-input-container>\n                <md-input-container ng-switch-default layout-fill>\n                    <label>{{filter.placeholder}}</label>\n                    <input ng-model=\"activeSelectionFilters[filter.column]\" minlength=\"3\"/>\n                </md-input-container>\n                <md-input-container ng-switch-when=\"checkbox\" >\n                    <md-checkbox class=\"checkbox-filter\" ng-model=\"activeSelectionFilters[filter.column]\">\n                        <span ng-if=\"filter.icon\">\n                            <i class=\"zmdi zmdi-hc-2x\" ng-style=\"{color: filter.iconColor}\" ng-class=\"filter.icon\"></i>\n                        </span>\n                        <span ng-if=\"filter.placeholder\">{{filter.placeholder}}</span>\n                    </md-checkbox>\n                </md-input-container>\n            </span>\n        </span>\n        </div>\n    </div>\n</div>\n\n\n\n<div layout-margin layout-gt-sm=\"row\" layout=\"column\" style=\"margin-right: -15px;\">\n    <md-button class=\"md-fab fab-pull-left\" aria-label=\"Upload file\" ng-if=\"canUploadFile\" ng-click=\"uploadFileDialog()\">\n        <i class=\"zmdi zmdi-upload zmdi-hc-2x fab-plus\"></i>\n    </md-button>\n    <md-button class=\"md-fab fab-pull-left\" aria-label=\"Add record\" ng-click=\"openEntityDialog({})\">\n        <i class=\"zmdi zmdi-plus zmdi-hc-2x fab-plus\"></i>\n    </md-button>\n\n    <span flex=\"\"></span>\n    <div layout-gt-sm=\"row\" layout=\"column\">\n        <div ng-repeat=\"button in buttons\">\n            <md-button class=\"md-raised\" ng-style=\"{color: button.bgColor}\" ng-disabled=\"!button.isEnabled()\" ng-click=\"button.confirmation(button.options, button.callback)\">\n                <span ng-style=\"{color: button.textColor}\">{{button.name}}</span>\n            </md-button>\n        </div>\n    </div>\n</div>\n<div layout=\"row\" class=\"is-active-container\">\n    <md-progress-linear ng-show=\"isServerRequestActive\" md-mode=\"indeterminate\"></md-progress-linear>\n</div>\n<div ng-if=\"!noResults\" class=\"md-whiteframe-12dp table-area table-margin-bottom\">\n    <md-table-container>\n        <table md-table>\n            <thead md-head md-order=\"query.order\" md-on-reorder=\"onReorder\">\n\n            <tr md-row>\n                <th md-column ng-if=\"multiselect\">\n                    <md-checkbox ng-if=\"showCheckbox\" ng-model=\"allEntitiesSelected\" ng-change=\"toggleSelectAll(allEntitiesSelected)\" aria-label=\"Select all\"></md-checkbox>\n                </th>\n                <th ng-repeat=\"(column, config) in columns  track by column\" md-column\n                    ng-attr-md-order-by=\"{{ config.orderBy ? config.orderBy : null }}\">\n                    {{ config.name.toUpperCase()}}\n                </th>\n                <th md-column style=\"text-align: right;\">\n                    <span style=\"padding-right: 10%\">ACTIONS</span>\n                </th>\n            </tr>\n            </thead>\n            <tbody md-body>\n            <tr md-row md-select=\"item\" md-select-id=\"{{item.id}}\" md-auto-select\n                ng-repeat=\"item in itemCollection\">\n                <td md-cell style=\"text-align: center\" ng-if=\"multiselect\">\n                    <md-checkbox ng-model=\"item.isChecked\" ng-change=\"multiselect.onChange(item)\" aria-label=\"Select\"></md-checkbox>\n                </td>\n                <td ng-repeat=\"(column, config) in columns\" ng-style=\"customItemStyle(item, column, config)\" md-cell>\n                    {{config.displayProperty ? item[column][config.displayProperty] : item[column].toString() }}\n                </td>\n                <td md-cell layout=\"row\" layout-align=\"end center\">\n                    <md-button ng-if=\"!action.shouldBeHidden(item)\" ng-disabled=\"action.shouldBeDisabled(item)\" class=\"md-icon-button table-action-button\"\n                               ng-click=\"action.callback(item)\" ng-repeat=\"action in actions\">\n                        <md-tooltip>{{action.title}}</md-tooltip>\n                        <i class=\"zmdi zmdi-hc-2x gray\" ng-style=\"{ color: action.shouldBeDisabled(item) ? \'gray\':action.color }\" ng-class=\"action.icon\"></i>\n                    </md-button>\n                    <md-button class=\"md-icon-button table-action-button\" title=\"Edit\">\n                        <md-tooltip>Edit</md-tooltip>\n                        <i class=\"zmdi zmdi-edit zmdi-hc-2x special-blue\" ng-click=\"openEntityDialog(item)\" ng-style=\"{ color: action.color }\"></i>\n                    </md-button>\n                    <md-button class=\"md-icon-button table-action-button\" ng-click=\"onDelete(item)\" title=\"Delete\">\n                        <md-tooltip>Delete</md-tooltip>\n                        <i class=\"zmdi zmdi-delete zmdi-hc-2x\" ng-style=\"{ color: \'red\' }\"></i>\n                    </md-button>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n    </md-table-container>\n    <md-table-pagination md-limit=\"query.limit\" md-page=\"query.page\" md-total=\"{{totalCount}}\" md-on-paginate=\"onPaginate\" md-page-select></md-table-pagination>\n</div>\n\n<div ng-if=\"noResults\" class=\"noResultsText\">There are no items available</div>\n<div ng-if=\"noFilterResults\" class=\"noResultsText\">Your search returned no results</div>");
$templateCache.put("js/dashboard/dashboard.html","<md-content layout=\"row\" class=\"dashboard\" layout-wrap flex=\"100\">\n    <div flex=\"100\" layout=\"row\">\n        <free-text-search-form layout=\"row\"\n                                flex=\"50\"\n                                flex-md=\"50\"\n                                flex-sm=\"100\"\n                                flex-xs=\"100\">\n        </free-text-search-form>\n        <div layout=\"row\" class=\"search-section-btn\" ng-click=\"toggleSearchSection()\">\n            <div class=\"icon\">\n                <i class=\"zmdi zmdi-filter-list zmdi-hc-2x\"></i>\n            </div>\n            <div class=\"info\" style=\"max-width:125px\" ng-class=\"{closed: isSearchSectionOpen}\">\n                <img class=\"available-beacons-icon-sm\" src=\"img/beacons-01.png\" alt=\"Beacons\">\n                <div class=\"available-beacons-count-sm\">{{availableCount}}</div>\n            </div>\n            <div class=\"add\">\n                <i class=\"zmdi zmdi-chevron-down arrowPositioning\" ng-show=\"!isSearchSectionOpen\"></i>\n                <i class=\"zmdi zmdi-chevron-up arrowPositioning\" ng-show=\"isSearchSectionOpen\"></i>\n            </div>\n        </div>\n    </div>\n\n\n    <div flex=\"100\" class=\"filter-action-area\" ng-class=\"{open: isSearchSectionOpen}\" layout=\"row\" layout-lt-md=\"column\" layout-wrap=\"\">\n        <filter-area type=\"type\"\n                     flex=\"75\"\n                     flex-md=\"65\"\n                     flex-sm=\"100\"\n                     flex-xs=\"100\"></filter-area>\n        <associate-action add-callback=\"addAllocation\"\n                          free-beacon-count=\"{{availableCount}}\"\n                          flex=\"25\"\n                          flex-md=\"35\"\n                          flex-sm=\"100\"\n                          flex-xs=\"100\"\n                          ng-if=\"ROLES.SAD || ROLES.HAD || ROLES.HCL\">\n        </associate-action>\n    </div>\n    <div layout=\"row\" flex=\"100\" layout-wrap>\n        <div layout=\"row\" flex=\"100\" layout-wrap>\n            <div ng-repeat=\"allocation in allocations | orderBy: \'-entryDate\'\" class=\"beacon-wrapper\">\n                <beacon-card allocation=\"allocation\" discard-callback=\"discard\" view-callback=\"viewAllocation\" edit-callback=\"addAllocation\"></beacon-card>\n            </div>\n        </div>\n    </div>\n    <div ng-if=\"noAssets && !filterIsApplied\" class=\"noAssetsRegisteredText\">No assets registered</div>\n    <div ng-if=\"noAssets && filterIsApplied\" class=\"noAssetsRegisteredText\">Your search returned no results</div>\n</md-content>");
$templateCache.put("js/dictionary/asset.html","<md-dialog flex=\"40\" layout-padding>\n    <form name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <md-input-container>\n                    <label>Asset type</label>\n                    <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"60\" minlength=\"4\">\n                    <div ng-messages=\"form.name.$error\" ng-show=\"form.name.$dirty && form.name.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n\n                <md-chips ng-model=\"status\"\n                          placeholder=\"Type and enter to add Asset Status\"\n                          md-on-remove=\"checkDefaultStatusStillPresent($chip)\"\n                          delete-button-label=\"Remove status\"\n                          delete-hint=\"Press delete to remove status\"\n                          secondary-placeholder=\"+New Status\">\n                    <md-chip-template>\n                            {{$chip.status || $chip}}\n                    </md-chip-template>\n                </md-chips>\n\n                <md-autocomplete\n                        ng-if=\"status.length != 0 && !isEditMode && showDefaultStatus\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.defaultStatus\"\n                        md-search-text=\"searchTextStatus\"\n                        md-items=\"option in querySearch(searchTextStatus, status)\"\n                        md-item-text=\"option\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Default status\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No status found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-autocomplete\n                        ng-if=\"status.length != 0 && isEditMode && showDefaultStatus\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.defaultStatus\"\n                        md-search-text=\"searchTextStatus\"\n                        md-items=\"option in statusSearch(searchTextStatus, status)\"\n                        md-item-text=\"option\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Default status\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No status found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-autocomplete\n                        ng-if=\"ROLES.SAD && isEditMode\"\n                        ng-disabled=\"isEditMode || model.suppressIntermediary\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.hospital\"\n                        md-search-text=\"searchTextHospital\"\n                        md-items=\"option in querySearch(searchTextHospital, formOptions.hospitals, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Hospital\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No hospitals found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-input-container>\n                    <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n                        <div ng-message=\'gateway\'>\n                            <div ng-repeat=\"errorText in validationErrors.gateway\">\n                                {{ errorText }}\n                            </div>\n                        </div>\n                    </div>\n                </md-input-container>\n            </div>\n            <div class=\"dictionaries-disclaimer\" ng-show=\"isEditMode\">{{::disclaimer}}</div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\"> Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/dictionary/dictionary.html","<md-content layout=\"row\" class=\"dashboard\" layout-wrap ng-if=\"ROLES.SAD\">\n    <md-toolbar layout=\"row\" class=\"\">\n        <div class=\"dictionaryToolbar md-toolbar-tools\">\n            <span class=\"dictionaryToolbarText\">Hospital Management</span>\n        </div>\n    </md-toolbar>\n    <div flex=\"100\" class=\"filter-action-area dictionary-area open\" layout=\"row\" layout-lt-lg=\"column\" >\n        <dictionary-search-form flex=\"30\"\n                               flex-md=\"50\"\n                               flex-xs=\"100\">\n        </dictionary-search-form>\n        <dictionary-filter-area class=\"dictionaryFilter\" flex=\"70\" flex-md-initial=\"45\"\n                     flex-md=\"50\"\n                     flex-xs=\"100\">\n        </dictionary-filter-area>\n    </div>\n</md-content>\n\n<crud-list\n        style=\"margin: auto;\"\n        resource=\"hospital\"\n        columns=\"hospitalColumns\"\n        create-form-url=\"js/dictionary/hospital.html\"\n        form-options=\"hospitalFormOptions\"\n        actions=\"actions\"\n        ng-if=\"ROLES.SAD\">\n</crud-list>\n\n\n<md-divider class=\"dividerMargin\" ng-if=\"ROLES.SAD\"></md-divider>\n\n<md-content layout=\"row\" class=\"dashboard\" layout-wrap>\n    <md-toolbar>\n        <div class=\"dictionaryToolbar md-toolbar-tools\">\n            <span class=\"dictionaryToolbarText\">Asset Type Management</span>\n        </div>\n    </md-toolbar>\n    <div flex=\"100\" class=\"filter-action-area dictionary-area open\" layout=\"row\" layout-lt-lg=\"column\" >\n        <assets-search-form flex=\"30\"\n                            flex-md=\"50\"\n                            flex-xs=\"100\">\n        </assets-search-form>\n        <asset-filter-area class=\"dictionaryFilter\" flex=\"70\" flex-md-initial=\"45\"\n                                flex-md=\"50\"\n                                flex-xs=\"100\">\n        </asset-filter-area>\n    </div>\n</md-content>\n\n<crud-list\n        style=\"margin: auto;\"\n        resource=\"dictionary/asset/type\"\n        columns=\"assetColumns\"\n        create-form-url=\"js/dictionary/asset.html\"\n        form-options=\"assetFormOptions\"\n        actions=\"actions\"\n        intermediate-template=\"js/dictionary/hospital-asset-selection.html\"\n        intermediate-controller=\"HospitalAssetIntermediaryController\">\n</crud-list>");
$templateCache.put("js/dictionary/hospital-asset-selection.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap>\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"model.hospital\"\n                            md-search-text=\"searchText\"\n                            md-items=\"option in querySearch(searchText)\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            md-floating-label=\"Hospital\"\n                            required=\"true\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No hospitals found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"proceed()\">Next</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/dictionary/hospital.html","<md-dialog flex=\"40\" layout-padding>\n    <form name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <md-input-container>\n                    <label>Name</label>\n                    <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"60\" minlength=\"4\">\n                    <div ng-messages=\"form.name.$error\" ng-show=\"form.name.$dirty && form.name.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n                <md-input-container>\n                    <md-checkbox ng-model=\"model.components.atrak\" aria-label=\"aTrak\">\n                        aTrak\n                    </md-checkbox><br>\n                    <md-checkbox ng-disabled=\"true\" ng-model=\"model.components.ptrak\" aria-label=\"pTrak\">\n                        pTrak\n                    </md-checkbox><br>\n                    <md-checkbox ng-model=\"model.components.mobile_atrak\" aria-label=\"mobile aTrak\">\n                        mobile aTrak\n                    </md-checkbox><br>\n                    <md-checkbox ng-disabled=\"true\" ng-model=\"model.components.mobile_ptrak\" aria-label=\"mobile pTrak\">\n                        mobile pTrak\n                    </md-checkbox><br>\n                </md-input-container>\n            </div>\n            <div class=\"dictionaries-disclaimer\" ng-show=\"isEditMode\">{{::disclaimer}}</div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid || !isCheckboxAreaValid(model.components)\" ng-click=\"save()\"> Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/file-upload/upload-modal.html","<md-dialog flex=\"40\" flex-md=\"60\" flex-sm=\"100\" class=\"upload-modal\" layout-padding>\n    <md-progress-linear ng-show=\"uploadInProgress\" md-mode=\"determinate\" value=\"{{progressPercentage}}\"></md-progress-linear>\n\n    <form ng-show=\"!uploadInProgress && !finishedUpload\" name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <md-button class=\"md-raised md-primary\" ngf-select ng-model=\"file\" name=\"file\" ngf-max-size=\"20MB\">Select file</md-button>\n            </div>\n            <div ng-show=\"file\" style=\"text-align: center;\">\n                {{file.name}}\n            </div>\n        </md-dialog-content>\n    </form>\n\n    <div ng-show=\"finishedUpload && stats.errors.length !== 0\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <div class=\"errors-title\">\n                    Please correct these errors and retry the upload\n                </div>\n                <div class=\"stats\">\n                    Valid entries: {{stats.correctEntries}}\n                    <br>\n                    Invalid entries: {{stats.incorrectEntries}}\n                </div>\n                <div class=\"errors-content\">\n                    <div class=\"error-msg\" ng-repeat=\"error in stats.errors\">\n                        <span class=\"custom-font\">{{$index + 1}} - {{error}}</span>\n                    </div>\n                </div>\n            </div>\n        </md-dialog-content>\n    </div>\n\n    <div ng-show=\"finishedUpload && stats.errors.length === 0\">\n        <md-dialog-content>\n            <div layout=\"column custom-font\" layout-padding layout-margin>\n                Upload complete: {{stats.correctEntries}} items were added to the system.\n            </div>\n        </md-dialog-content>\n    </div>\n\n    <md-dialog-actions>\n        <md-button class=\"md-warn\" ng-hide=\"uploadInProgress || (finishedUpload && stats.errors.length === 0)\" ng-click=\"close(false)\">\n            Cancel\n        </md-button>\n        <md-button class=\"md-primary\" ng-click=\"backToFileSelection()\" ng-show=\"finishedUpload && stats.errors.length !== 0\">\n            Back To File Selection\n        </md-button>\n        <md-button class=\"md-primary\" ng-disabled=\"!form.file.$valid || !file\" ng-click=\"submit()\" ng-show=\"!uploadInProgress && !finishedUpload\">\n            Upload\n        </md-button>\n        <md-button class=\"md-primary\" ng-click=\"close(true)\" ng-show=\"finishedUpload && stats.errors.length === 0\">\n            Finish\n        </md-button>\n    </md-dialog-actions>\n</md-dialog>");
$templateCache.put("js/gateway/create.html","<md-dialog flex=\"40\" layout-padding>\n    <form name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <md-input-container>\n                    <label>Name</label>\n                    <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"60\" minlength=\"4\">\n                    <div ng-messages=\"form.name.$error\" ng-show=\"form.name.$dirty && form.name.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n\n                <md-input-container>\n                    <label>MAC Address</label>\n                    <input name=\"uuid\" ng-model=\"model.uuid\" required md-maxlength=\"45\" minlength=\"10\">\n                    <div ng-messages=\"form.uuid.$error\" ng-if=\"form.uuid.$dirty && form.uuid.$invalid\" role=\"alert\">\n                        <div ng-message=\'required\'>This is required!</div>\n                        <div ng-message=\'maxlength\'>That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                    <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n                        <div ng-repeat=\"errorText in validationErrors[\'Gateway.uuid\']\">\n                            {{ errorText }}\n                        </div>\n                    </div>\n                    <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n                        <div ng-repeat=\"errorText in validationErrors[\'Gateway.macAddr\']\">\n                            {{ errorText }}\n                        </div>\n                    </div>\n                </md-input-container>\n\n                <md-input-container ng-if=\"isEditMode\">\n                    <label>IP</label>\n                    <input name=\"ip\" ng-model=\"model.ip\" md-maxlength=\"45\" minlength=\"9\" disabled>\n                    <div ng-messages=\"form.ip.$error\" ng-if=\"form.ip.$dirty && form.ip.$invalid\" role=\"alert\">\n                        <div ng-message=\'required\'>This is required!</div>\n                        <div ng-message=\'maxlength\'>That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                    <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n                        <div ng-repeat=\"errorText in validationErrors[\'Gateway.ip\']\">\n                            {{ errorText }}\n                        </div>\n                    </div>\n                </md-input-container>\n\n                <md-autocomplete\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.room\"\n                        md-search-text=\"searchTextRoom\"\n                        md-items=\"option in querySearch(searchTextRoom, formOptions.rooms, \'name\')\"\n                        md-item-text=\"getFormattedArea(option)\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Area\">\n                    <md-item-template>\n                            <span md-highlight-flags=\"^i\">\n                                {{option.name}}\n                                <span ng-if=\"option.parent.name\">{{option.parent.name == null ? \'\':\' - \' + option.parent.name}}</span>\n                            </span>\n                    </md-item-template>\n                    <md-not-found>\n                        No rooms found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-autocomplete\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.controlBeacon\"\n                        md-search-text=\"searchTextBeacons\"\n                        md-items=\"option in querySearch(searchTextBeacons, formOptions.beacons, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Beacon\">\n                    <md-item-template>\n                            <span md-highlight-flags=\"^i\">\n                                <span ng-if=\"option.parent.name\">{{option.parent.name + \', \'}}</span>\n                                {{option.name}}\n                            </span>\n                    </md-item-template>\n                    <md-not-found>\n                        No beacons found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-autocomplete\n                        ng-hide=\"model.suppressIntermediary\"\n                        ng-disabled=\"isEditMode\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.hospital\"\n                        md-search-text=\"searchTextHospitals\"\n                        md-items=\"option in querySearch(searchTextHospitals, formOptions.hospitals, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Hospital\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No hospitals found\n                    </md-not-found>\n                </md-autocomplete>\n            </div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\"> Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/gateway/gateway.html","<crud-list\n        resource=\"gateway\"\n        columns=\"columns\"\n        filter-config=\"filterConfig\"\n        create-form-url=\"js/gateway/create.html\"\n        form-options=\"formOptions\"\n        actions=\"actions\"\n        intermediate-template=\"js/gateway/hospital-gateway-selection.html\"\n        intermediate-controller=\"HospitalGatewayIntermediaryController\">\n</crud-list>");
$templateCache.put("js/gateway/hospital-gateway-selection.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap>\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"model.hospital\"\n                            md-search-text=\"searchText\"\n                            md-items=\"option in querySearch(searchText)\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            md-floating-label=\"Hospital\"\n                            required=\"true\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No hospitals found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"proceed()\">Next</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/liveFeed/liveFeed.html","<md-table-container>\n    <table md-table style=\"margin-top: 40px\">\n        <thead md-head md-order=\"query.order\" md-on-reorder=\"onReorder\">\n        <tr md-row>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"timestamp\"><span>Timestamp</span></th>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"gatewayName\"><span>Gateway Name</span>\n            </th>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"beaconName\">Beacon Name</th>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"rssi\">RSSI</th>\n        </tr>\n        </thead>\n        <tbody md-body>\n        <tr md-row md-select=\"historyItem\" md-select-id=\"{{historyItem.beaconName}}\" md-auto-select\n            ng-repeat=\"historyItem in historyList\">\n            <td md-cell>{{historyItem.timestamp | date:\'MM/dd/yyyy HH:mm:ss\'}}</td>\n            <td md-cell>{{historyItem.gatewayName}}</td>\n            <td md-cell>{{historyItem.beaconName}}</td>\n            <td md-cell>{{historyItem.rssi | number: 2}} %</td>\n        </tr>\n        </tbody>\n    </table>\n</md-table-container>\n\n<md-table-pagination md-limit=\"query.limit\" md-page=\"query.page\" md-total=\"{{query.total}}\" md-on-paginate=\"onPaginate\" md-page-select></md-table-pagination>");
$templateCache.put("js/login/login.html","<md-content layout=\"column\" flex layout-align=\"center center\">\n    <div class=\"loginIEMaxWidth\" style=\"width: 100%; min-height: 300px;\" layout=\"row\" layout-align=\"center center\">\n        <md-whiteframe style=\"width: 100%; height: 100%;\" class=\"md-whiteframe-6dp\" layout=\"column\" flex=\"30\" flex-sm=\"100\" flex-xs=\"100\" layout-padding>\n            <form name=\"form\" class=\"loginIEMaxHeight\">\n                <md-content md-theme=\"docs-dark\">\n                    <img src=\"/img/logo.png\" width=\"100%\"/>\n                    <md-input-container layout=\"column\">\n                        <label>Email</label>\n                        <input name=\"email\" type=\"email\" ng-model=\"user.email\" required>\n                        <div ng-messages=\"form.email.$error\" ng-show=\"form.email.$dirty && form.email.$invalid\">\n                            <div ng-message=\"required\">Please enter an email address</div>\n                            <div ng-message=\"email\">Please enter a valid email address</div>\n                        </div>\n                    </md-input-container>\n                    <md-input-container layout=\"column\">\n                        <label>Password</label>\n                        <input name=\"pwd\" ng-model=\"user.password\" type=\"password\" required/>\n                        <div ng-messages=\"form.pwd.$error\" ng-show=\"form.pwd.$dirty && form.pwd.$invalid\">\n                            <div ng-message=\"required\">Please enter a password</div>\n                        </div>\n                    </md-input-container>\n\n                    <md-input-container>\n                        <div ng-messages=\"errors\" ng-if=\"errors.length > 0\" role=\"alert\">\n                            <div ng-repeat=\"errorText in errors\">\n                                {{ errorText.toString() }}\n                            </div>\n                        </div>\n                    </md-input-container>\n\n                    <div layout=\"row\" layout-sm=\"column\" layout-align=\"end center\" layout-margin>\n                        <md-button class=\"md-raised\" flex=\"50\" flex-sm=\"100\" ng-disabled=\"form.$invalid\" ng-click=\"login()\">Login</md-button>\n                    </div>\n                </md-content>\n            </form>\n        </md-whiteframe>\n    </div>\n    <div layout=\"column\" layout-margin>\n        <a class=\"forgot-password-btn\" href=\"#/resetPassword\">\n            Forgot password?\n        </a>\n    </div>\n\n    <div ng-show=\"isAccountLocked\" class=\"locked-account\">\n        {{::lockedMessage}}\n    </div>\n\n</md-content>");
$templateCache.put("js/main/main.html","<div layout=\"column\" layout-fill flex>\n    <ui-view name=\"toolbar\"></ui-view>\n\n    <md-content layout=\"row\" layout-fill flex>\n        <ui-view name=\"sidenav\" class=\"md-whiteframe-6dp sidenav\"></ui-view>\n        <md-content layout=\"row\" flex>\n            <ui-view name=\"content\" class=\"content\"  flex layout-margin></ui-view>\n        </md-content>\n    </md-content>\n</div>\n");
$templateCache.put("js/password-management/password-management.html","<md-content class=\"loginIEMaxWidth\" layout=\"column\" flex layout-align=\"center center\" ng-if=\"!showExpiredTokenMessage\" ng-cloak>\n\n    <div layout=\"row\" class=\"loginIEMaxWidth\" layout-align=\"center center\" ng-if=\"isRequestingReset\">\n        <md-whiteframe style=\"width: 100%; min-height: 300px; min-width: 500px;\" class=\"md-whiteframe-6dp\" layout=\"column\" flex=\"40\" flex-sm=\"100\" layout-padding>\n            <form class=\"loginIEMaxHeight\" name=\"requestResetForm\">\n                <md-content md-theme=\"docs-dark\">\n                    <img src=\"/img/logo.png\" width=\"100%\"/>\n                    <md-input-container layout=\"column\">\n                        <label>Email</label>\n                        <input name=\"email\" ng-model=\"resetObject.email\" type=\"email\" required/>\n                        <div ng-messages=\"requestResetForm.email.$error\" ng-show=\"requestResetForm.email.$dirty && requestResetForm.email.$invalid\">\n                            <div ng-message=\"required\">Please enter an email address</div>\n                            <div ng-message=\"email\">Please enter a valid email address</div>\n                        </div>\n                    </md-input-container>\n                    <div layout=\"row\" layout-sm=\"column\" layout-align=\"center center\" layout-margin>\n                        <md-button class=\"md-raised\" flex=\"40\" flex-md=\"60\" flex-sm=\"100\"\n                                   ng-disabled=\"requestResetForm.$invalid\" ng-click=\"requestPasswordReset()\">\n                            Reset password\n                        </md-button>\n                    </div>\n                </md-content>\n            </form>\n        </md-whiteframe>\n    </div>\n\n    <div layout=\"row\" class=\"loginIEMaxWidth\" layout-align=\"center center\" ng-if=\"!isRequestingReset && !showExpiredTokenMessage\">\n        <md-whiteframe style=\"height: 100%; min-width: 500px;\" class=\"md-whiteframe-6dp\" layout=\"column\" flex=\"40\" flex-sm=\"100\" layout-padding>\n            <form class=\"loginIEMaxHeight\" name=\"passwordSetForm\">\n                <md-content md-theme=\"docs-dark\">\n                    <img src=\"/img/logo.png\" width=\"100%\"/>\n                    <md-input-container style=\"width: auto;\" layout=\"row\" layout-sm=\"column\">\n                        <label>Set Password</label>\n                        <input style=\"flex: 1\" ng-model=\"newPasswordObject.newPassword\" type=\"password\" required/>\n                    </md-input-container>\n                    <md-input-container layout=\"row\" layout-sm=\"column\">\n                        <label>Confirm Password</label>\n                        <input style=\"flex: 1\" ng-model=\"newPasswordObject.confirmNewPassword\" type=\"password\" required/>\n                    </md-input-container>\n                    <md-input-container>\n                        <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n                            <div ng-repeat=\"errorText in validationErrors.User\">\n                                {{ errorText }}\n                            </div>\n                            <div ng-repeat=\"errorText in validationErrors[\'User.password\']\">\n                                {{ errorText }}\n                            </div>\n                        </div>\n                    </md-input-container>\n\n                    <div layout=\"row\" layout-sm=\"column\" layout-align=\"center center\" layout-margin>\n                        <md-button class=\"md-raised\" flex=\"40\" flex-md=\"60\" flex-sm=\"100\"\n                                   ng-disabled=\"passwordSetForm.$invalid || !canSubmitPassword(newPasswordObject.newPassword)\"\n                                   ng-click=\"setNewPassword()\">Save\n                        </md-button>\n                    </div>\n                </md-content>\n            </form>\n\n            <div class=\"pwd-conditions-container\">\n                <div>\n                    <div class=\"validation-group\"\n                         ng-class=\"{\'valid\': passwordConditions.hasRequiredLength(newPasswordObject.newPassword)}\">\n                        <i class=\"zmdi zmdi-check zmdi-hc-2x green\"\n                           ng-show=\"passwordConditions.hasRequiredLength(newPasswordObject.newPassword)\"></i>\n                        <i class=\"zmdi zmdi-close zmdi-hc-2x specialRed\"\n                           ng-show=\"!passwordConditions.hasRequiredLength(newPasswordObject.newPassword)\"></i>\n                        <div class=\"title\" style=\"margin-left: 13px;\">Minimum 8 characters in length</div>\n                    </div>\n                </div>\n\n                <div class=\"multiple-conditions\">\n                    <div class=\"conditions-header\"\n                         ng-class=\"{\'valid\': passwordConditions.meetsConditions(newPasswordObject.newPassword)}\">\n                        <i class=\"zmdi zmdi-check zmdi-hc-2x green\"\n                           ng-show=\"passwordConditions.meetsConditions(newPasswordObject.newPassword)\"></i>\n                        <i class=\"zmdi zmdi-close zmdi-hc-2x specialRed\"\n                           ng-show=\"!passwordConditions.meetsConditions(newPasswordObject.newPassword)\"></i>\n                        <div class=\"title\" style=\"display: inline-block; height: 24px; line-height: 24px; margin-left: 13px\">\n                            Meets at least 3 of the following:\n                        </div>\n                    </div>\n\n                    <div class=\"conditions-item\">\n                        <div class=\"validation-group\"\n                              ng-class=\"{\'valid\': passwordConditions.hasLowerCaseChar(newPasswordObject.newPassword)}\">\n                            <i class=\"zmdi zmdi-check zmdi-hc-2x green\"\n                               ng-show=\"passwordConditions.hasLowerCaseChar(newPasswordObject.newPassword)\"></i>\n                            <i class=\"zmdi zmdi-close zmdi-hc-2x specialRed\"\n                               ng-show=\"!passwordConditions.hasLowerCaseChar(newPasswordObject.newPassword)\"></i>\n                            <div class=\"title\">\n                                Contains a lowercase character\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class=\"conditions-item\">\n                        <div class=\"validation-group\"\n                              ng-class=\"{\'valid\': passwordConditions.hasUpperCaseChar(newPasswordObject.newPassword)}\">\n                            <i class=\"zmdi zmdi-check zmdi-hc-2x green\"\n                               ng-show=\"passwordConditions.hasUpperCaseChar(newPasswordObject.newPassword)\"></i>\n                            <i class=\"zmdi zmdi-close zmdi-hc-2x specialRed\"\n                               ng-show=\"!passwordConditions.hasUpperCaseChar(newPasswordObject.newPassword)\"></i>\n                            <div class=\"title\">\n                                Contains an uppercase character\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class=\"conditions-item\">\n                        <div class=\"validation-group\"\n                              ng-class=\"{\'valid\': passwordConditions.hasNumber(newPasswordObject.newPassword)}\">\n                            <i class=\"zmdi zmdi-check zmdi-hc-2x green\"\n                               ng-show=\"passwordConditions.hasNumber(newPasswordObject.newPassword)\"></i>\n                            <i class=\"zmdi zmdi-close zmdi-hc-2x specialRed\"\n                               ng-show=\"!passwordConditions.hasNumber(newPasswordObject.newPassword)\"></i>\n                            <div class=\"title\">\n                                Contains an digit or number\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class=\"conditions-item\">\n                        <div class=\"validation-group\"\n                              ng-class=\"{\'valid\': passwordConditions.hasSpecialChar(newPasswordObject.newPassword)}\">\n                            <i class=\"zmdi zmdi-check zmdi-hc-2x green\"\n                               ng-show=\"passwordConditions.hasSpecialChar(newPasswordObject.newPassword)\"></i>\n                            <i class=\"zmdi zmdi-close zmdi-hc-2x specialRed\"\n                               ng-show=\"!passwordConditions.hasSpecialChar(newPasswordObject.newPassword)\"></i>\n                            <div class=\"title\">\n                                Contains a special character ($, !, #, %, &, *, @)\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n            </div>\n\n        </md-whiteframe>\n    </div>\n\n</md-content>\n\n<md-content layout=\"column\" flex layout-align=\"center center\" ng-if=\"showExpiredTokenMessage\">\n    <div class=\"loginIEMaxWidth\" style=\"width: 100%; min-height: 300px;\" layout=\"row\" layout-align=\"center center\">\n        <md-whiteframe style=\"width: 100%; height: 100%;\" class=\"md-whiteframe-6dp\" layout=\"column\" flex=\"30\" flex-sm=\"100\" flex-xs=\"100\" layout-padding>\n            <form name=\"form\" class=\"loginIEMaxHeight\">\n                <md-content md-theme=\"docs-dark\">\n                    <img src=\"/img/logo.png\" width=\"100%\"/>\n\n                    <div layout=\"row\" layout-sm=\"column\" layout-align=\"end center\" layout-margin>\n                        <span style=\"font-family: gotham_mediumregular\">\n                            Your link is valid for a limited amount of time and for a single use only.\n                            <br>\n                            Please contact the Clinical Engineering Department for assistance!\n                        </span>\n                    </div>\n                </md-content>\n            </form>\n        </md-whiteframe>\n    </div>\n\n</md-content>\n\n<md-button class=\"back-to-login\" ng-if=\"isRequestingReset || showExpiredTokenMessage\" ng-click=\"backToLogin()\">\n    <i class=\"zmdi zmdi-chevron-left\"></i>\n    Back to login\n</md-button>\n");
$templateCache.put("js/room/create.html","<md-dialog flex=\"40\" layout-padding>\n    <form name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n                <md-input-container>\n                    <label>Name</label>\n                    <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"60\" minlength=\"4\">\n                    <div ng-messages=\"form.name.$error\" ng-show=\"form.name.$dirty && form.name.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n\n                <md-input-container>\n                    <label>Description</label>\n                    <input name=\"description\" ng-model=\"model.description\" md-maxlength=\"255\">\n                    <div ng-messages=\"form.description.$error\" ng-if=\"form.description.$dirty && form.description.$invalid\" role=\"alert\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\'md-maxlength\'>That\'s too long!</div>\n                    </div>\n                </md-input-container>\n\n                <md-autocomplete\n                        ng-disabled=\"model.id != undefined && model.hasChildren\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.parent\"\n                        md-search-text=\"searchTextRoom\"\n                        md-items=\"option in querySearch(searchTextRoom, formOptions.rooms, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Parent\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No items available\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-input-container ng-if=\"!model.hasChildren\">\n                    <label>Asset Type</label>\n                    <md-select ng-model=\"model.assetTypes\" ng-if=\"recreateSelect\" ng-change=\"loadStatusesForAssetType(model)\">\n                        <md-option disabled ng-if=\"formOptions.assetTypes.length == 0\">No items available</md-option>\n                        <md-option style=\"color: darkgray\" ng-value=null ng-click=\"resetSelect()\">None</md-option>\n                        <md-option ng-repeat=\"option in formOptions.assetTypes\" ng-selected=\"option.id == model.assetMappings[0].assetType.id\"  ng-value=\"option\">\n                            {{option.name}}\n                        </md-option>\n                    </md-select>\n                </md-input-container>\n\n                <md-input-container ng-if=\"model.assetTypes\">\n                    <label>Status</label>\n                    <md-select ng-model=\"model.assetStatus\" required>\n                        <md-option disabled ng-if=\"formOptions.statuses.length == 0\">No items available</md-option>\n                        <md-option ng-repeat=\"option in formOptions.statuses\" ng-selected=\"option.id == model.assetMappings[0].assetStatus.id\" ng-value=\"option\">\n                            {{option.status}}\n                        </md-option>\n                    </md-select>\n                </md-input-container>\n\n                <md-autocomplete\n                        ng-if=\"ROLES.SAD && !model.suppressIntermediary\"\n                        ng-disabled=\"isEditMode\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.hospital\"\n                        md-items=\"option in formOptions.hospitals\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Hospital\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No hospital found\n                    </md-not-found>\n                </md-autocomplete>\n\n            </div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\"> Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/room/hospital-room-selection.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap>\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"model.hospital\"\n                            md-search-text=\"searchText\"\n                            md-items=\"option in querySearch(searchText)\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            md-floating-label=\"Hospital\"\n                            required=\"true\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No hospitals found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"proceed()\">Next</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/room/room.html","<crud-list\n        resource=\"room\"\n        query=\"options.query\"\n        columns=\"columns\"\n        filter-config=\"filterConfig\"\n        create-form-url=\"js/room/create.html\"\n        form-options=\"formOptions\"\n        actions=\"actions\"\n        intermediate-template=\"js/room/hospital-room-selection.html\"\n        intermediate-controller=\"HospitalRoomIntermediaryController\">\n</crud-list>");
$templateCache.put("js/sidenav/sidenav.html","<md-content layout=\"column\">\n    <md-sidenav class=\"md-sidenav-left\" md-component-id=\"left\" md-is-locked-open=\"true\">\n        <md-content class=\"sidenavHover\" style=\"background-color: transparent\">\n            <md-list>\n                <md-list-item ui-sref-active-eq=\"selected\">\n                    <div class=\"md-list-item-text\">\n                        <md-button ui-sref=\".\">\n                            <i class=\"zmdi zmdi-home zmdi-hc-2x\"></i>\n                            <span ng-show=\"isSidenavOpen\">Dashboard</span>\n                        </md-button>\n                    </div>\n                </md-list-item>\n                <md-list-item ui-sref-active-eq=\"selected\" ng-if=\"ROLES.SAD || ROLES.HAD\">\n                    <div class=\"md-list-item-text\">\n                        <md-button ui-sref=\".beacon\">\n                            <i class=\"zmdi zmdi-bluetooth-setting zmdi-hc-2x\"></i>\n                            <span ng-show=\"isSidenavOpen\">Beacon management</span>\n                        </md-button>\n                    </div>\n                </md-list-item>\n                <md-list-item ui-sref-active-eq=\"selected\" ng-if=\"ROLES.SAD || ROLES.HAD\">\n                    <div class=\"md-list-item-text\">\n                        <md-button ui-sref=\".user\">\n                            <i class=\"zmdi zmdi-accounts-alt zmdi-hc-2x\"></i>\n                            <span ng-show=\"isSidenavOpen\">User management</span>\n                        </md-button>\n                    </div>\n                </md-list-item>\n                <md-list-item ui-sref-active-eq=\"selected\"  ng-if=\"ROLES.SAD || ROLES.HAD\">\n                    <div class=\"md-list-item-text\">\n                        <md-button ui-sref=\".room\">\n                            <i class=\"zmdi zmdi-pin zmdi-hc-2x\"></i>\n                            <span ng-show=\"isSidenavOpen\">Area management</span>\n                        </md-button>\n                    </div>\n                </md-list-item>\n                <md-list-item ui-sref-active-eq=\"selected\" ng-if=\"ROLES.SAD\">\n                    <div class=\"md-list-item-text\">\n                        <md-button ui-sref=\".gateway\">\n                            <i class=\"zmdi zmdi-bluetooth-search zmdi-hc-2x\"></i>\n                            <span ng-show=\"isSidenavOpen\">Gateway management</span>\n                        </md-button>\n                    </div>\n                </md-list-item>\n                <md-list-item ui-sref-active-eq=\"selected\" ng-if=\"ROLES.SAD || ROLES.HAD\">\n                    <div class=\"md-list-item-text\">\n                        <md-button ui-sref=\".dictionary\">\n                            <i class=\"zmdi zmdi-view-web zmdi-hc-2x\"></i>\n                            <span ng-show=\"isSidenavOpen\">System configuration</span>\n                        </md-button>\n                    </div>\n                </md-list-item>\n            </md-list>\n        </md-content>\n    </md-sidenav>\n</md-content>\n<md-list-item class=\"toggle-sidenav\" style=\"position: absolute;bottom: 10px;\" layout-align=\"end end\">\n    <div class=\"md-list-item-text\">\n        <md-button ng-click=\"toggleSidenav()\" style=\"min-width: 0; width: 50px; text-align: center;line-height: 15px\">\n            <i class=\"zmdi zmdi-chevron-right zmdi-hc-2x\" ng-if=\"!isSidenavOpen\"></i>\n            <i class=\"zmdi zmdi-chevron-right zmdi-hc-2x\" ng-if=\"!isSidenavOpen\"></i>\n            <i class=\"zmdi zmdi-chevron-left zmdi-hc-2x\" ng-if=\"isSidenavOpen\"></i>\n            <i class=\"zmdi zmdi-chevron-left zmdi-hc-2x\" ng-if=\"isSidenavOpen\"></i>\n        </md-button>\n    </div>\n</md-list-item>");
$templateCache.put("js/simpleLiveFeed/simpleLiveFeed.html","<md-table-container>\n    <table md-table style=\"margin-top: 40px\">\n        <thead md-head md-order=\"query.order\" md-on-reorder=\"onReorder\">\n        <tr md-row>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"timestamp\"><span>Timestamp</span></th>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"gatewayName\"><span>Gateway Name</span>\n            </th>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"beaconName\">Beacon Name</th>\n            <th style=\"background-color: #3ab8c3;color: white;font-size: 14px;\" md-column md-order-by=\"rssi\">RSSI</th>\n        </tr>\n        </thead>\n        <tbody md-body>\n        <tr md-row md-select=\"historyItem\" md-select-id=\"{{historyItem.beaconName}}\" md-auto-select\n            ng-repeat=\"historyItem in historyList\">\n            <td md-cell ng-if=\"historyItem.timestamp != null\">{{historyItem.timestamp | date:\'MM/dd/yyyy HH:mm:ss\'}}</td>\n            <td md-cell ng-if=\"historyItem.timestamp == null\">No signal received</td>\n            <td md-cell>{{historyItem.gatewayName}}</td>\n            <td md-cell>{{historyItem.beaconName}}</td>\n            <td md-cell ng-if=\"historyItem.timestamp != null\" >{{historyItem.rssi | number: 2}} dBµ</td>\n            <td md-cell ng-if=\"historyItem.timestamp == null\">{{0 | number: 2}} dBµ</td>\n        </tr>\n        </tbody>\n    </table>\n</md-table-container>\n\n<md-table-pagination md-limit=\"query.limit\" md-page=\"query.page\" md-total=\"{{query.total}}\" md-on-paginate=\"onPaginate\" md-page-select></md-table-pagination>");
$templateCache.put("js/toolbar/toolbar.html","<md-toolbar md-scroll-shrink=\"true\" class=\"main-toolbar md-whiteframe-6dp\">\n    <div class=\"md-toolbar-tools\">\n        <img src=\"/img/logo.png\" height=\"40\"/>\n        <!-- fill up the space between left and right area -->\n        <span flex></span>\n        <md-button disabled=\"true\">\n            <i class=\"zmdi zmdi-account-box\"></i>\n            {{user.firstName + \' \' + user.lastName}}\n        </md-button>\n        <md-button ng-click=\"logout()\">\n            Log Out\n        </md-button>\n    </div>\n</md-toolbar>");
$templateCache.put("js/user/create.html","<md-dialog flex=\"40\" layout-padding>\n    <form name=\"form\">\n        <md-dialog-content>\n            <div layout=\"column\" layout-padding layout-margin>\n\n                <md-input-container>\n                    <label>First Name</label>\n                    <input name=\"firstName\" ng-model=\"model.firstName\" required md-maxlength=\"60\" minlength=\"1\">\n                    <div ng-messages=\"form.firstName.$error\" ng-show=\"form.firstName.$dirty && form.firstName.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n\n                <md-input-container>\n                    <label>Last Name</label>\n                    <input name=\"lastName\" ng-model=\"model.lastName\" required md-maxlength=\"60\" minlength=\"1\">\n                    <div ng-messages=\"form.lastName.$error\" ng-show=\"form.lastName.$dirty && form.lastName.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n\n                <md-input-container>\n                    <label>Email</label>\n                    <input name=\"email\" type=\"email\" ng-model=\"model.email\" ng-disabled=\"isEditMode\" required md-maxlength=\"60\" minlength=\"1\">\n                    <div ng-messages=\"form.email.$error\" ng-show=\"form.email.$dirty && form.email.$invalid\">\n                        <div ng-message=\"required\">This is required!</div>\n                        <div ng-message=\"md-maxlength\">That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                        <div ng-message=\"email\">Please enter a valid email address</div>\n                    </div>\n                    <div ng-messages=\"validationErrors\" ng-if=\"validationErrors\" role=\"alert\">\n                        <div ng-repeat=\"errorText in validationErrors[\'User.email\']\">\n                            {{ errorText }}\n                        </div>\n                    </div>\n                </md-input-container>\n\n                <md-autocomplete\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.role\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Role\"\n                        md-search-text=\"searchTextRole\"\n                        md-items=\"option in querySearch(searchTextRole, formOptions.roles, \'name\')\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No role found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-autocomplete\n                        ng-if=\"(model.role.isSuperAdmin != true) && ROLES.SAD && !model.suppressIntermediary\"\n                        ng-disabled=\"isEditMode && !(hospitalIsNull && !model.role.isSuperAdmin)\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.hospital\"\n                        md-search-text=\"searchTextHospital\"\n                        md-items=\"option in querySearch(searchTextHospital, formOptions.hospitals, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Hospital\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No hospital found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-checkbox class=\"checkbox-display\" ng-if=\"!model.isActive && !model.hasPasswordSet\" ng-model=\"model.sendInvitation\">\n                    Send activation email\n                </md-checkbox>\n            </div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-secondary\" ng-if=\"isEditMode && model.isActive\" ng-click=\"resetUserPassword(model)\"> Reset Password</md-button>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\"> Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/user/hospital-user-selection.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap>\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"model.hospital\"\n                            md-search-text=\"searchText\"\n                            md-items=\"option in querySearch(searchText)\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            md-floating-label=\"Hospital\"\n                            required=\"true\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No hospitals found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"proceed()\">Next</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/user/role-change.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap>\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"role\"\n                            md-search-text=\"searchText\"\n                            md-items=\"option in querySearch(searchText)\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            md-floating-label=\"Role\"\n                            required=\"true\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No roles found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\">Save</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/user/user.html","<crud-list\n        resource=\"user\"\n        columns=\"columns\"\n        buttons=\"buttons\"\n        multiselect=\"userselect\"\n        filter-config=\"filterConfig\"\n        create-form-url=\"js/user/create.html\"\n        form-options=\"formOptions\"\n        actions=\"actions\"\n        can-upload-file=\"true\"\n        intermediate-template=\"js/user/hospital-user-selection.html\"\n        intermediate-controller=\"HospitalUserIntermediaryController\"></crud-list>");
$templateCache.put("js/dashboard/beacon/card.html","<md-card class=\"beacon-tile\">\n    <md-card-title  ng-click=\"viewCallback(\'asset\',allocation)\">\n        <md-card-title-text layout=\"row\" layout-wrap>\n            <div flex=\"65\" class=\"card-title\">\n                <div class=\"md-subhead label\">ID</div>\n                <span class=\"md-headline beacon-name\">{{ allocation.allocationName.toUpperCase() }}</span>\n            </div>\n            <div flex=\"35\" layout-align=\" center\">\n                <div class=\"md-subhead label label-in right\">IN</div>\n                <div class=\"md-headline time-in time-in-text\" ng-if=\"::allocation.entryDate\">{{ allocation.entryDate | amDateFormat:\'MM/DD/YY\'  }}</div>\n                <div class=\"md-headline time-in time-in-text\" ng-if=\"::allocation.entryDate\">{{ allocation.entryDate | amDateFormat:\'hh:mm A\'  }}</div>\n                <div class=\"md-headline time-in time-in-text\" ng-if=\"!allocation.entryDate\">&mdash;</div>\n            </div>\n            <div flex=\"100\" ng-if=\"::allocation.meta.assetType\">\n                <div class=\"md-subhead label label-in\">Type</div>\n                <span class=\"md-headline meta\">{{ ::allocation.meta.assetType }}</span>\n            </div>\n            <div flex=\"100\" ng-if=\"::allocation.allocationStatus\">\n                <div class=\"md-subhead label label-in\">Status</div>\n                <span class=\"md-headline meta\">{{ ::allocation.allocationStatus }}</span>\n            </div>\n            <div flex=\"100\">\n                <div class=\"md-subhead label label-in\">Location</div>\n                <span class=\"md-headline meta\">\n                    <span ng-if=\"!allocation.location\">UNKNOWN</span>\n                    <span ng-if=\"allocation.location.area && !allocation.location.room\">{{allocation.location.area}}</span>\n                    <span ng-if=\"!allocation.location.area && allocation.location.room\">{{allocation.location.room}}</span>\n                    <span ng-if=\"allocation.location.area && allocation.location.room\">{{allocation.location.area}}, {{allocation.location.room}}</span>\n                </span>\n            </div>\n            <div flex=\"100\" ng-if=\"::allocation.surgery\">\n                <div class=\"md-subhead label label-in\">Surgery</div>\n                <span class=\"md-headline meta\">{{ allocation.surgery }}</span>\n            </div>\n            <div flex=\"100\" ng-if=\"::allocation.doctor\">\n                <div class=\"md-subhead label label-in\" ng-if=\"::allocation.doctor\">Doctor</div>\n                <span class=\"md-headline meta\">{{ allocation.doctor }}</span>\n            </div>\n        </md-card-title-text>\n        <md-card-title-media>\n\n        </md-card-title-media>\n    </md-card-title>\n    <md-card-actions layout=\"row\" layout-align=\"start center\">\n        <div flex=\"100\" layout-align=\"end center\" class=\"action-buttons\" ng-if=\"ROLES.SAD || ROLES.HAD || ROLES.HCL\">\n            <md-button class=\"md-icon-button edit-action\" ng-click=\"editCallback(\'asset\',allocation)\">\n                <md-tooltip>Edit</md-tooltip>\n                <i class=\"zmdi zmdi-edit zmdi-hc-2x special-blue\"></i>\n            </md-button>\n            <md-button class=\"md-icon-button md-warn\" ng-click=\"discardCallback(allocation)\">\n                <md-tooltip>Discharge</md-tooltip>\n                <i class=\"zmdi zmdi-delete zmdi-hc-2x red\"></i>\n            </md-button>\n        </div>\n    </md-card-actions>\n</md-card>");
$templateCache.put("js/dashboard/create/asset.html","<md-dialog flex=\"45\" flex-md=\"60\">\n    <ng-form name=\"form\">\n        <md-dialog-content layout-padding>\n            <div layout=\"row\">\n\n                <md-autocomplete\n                        flex=\"30\"\n                        class=\"autocomplete-field-create-asset\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.beacon\"\n                        md-search-text=\"searchTextBeacon\"\n                        md-items=\"option in querySearch(searchTextBeacon, beacons, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Select beacon\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No beacons found\n                    </md-not-found>\n                </md-autocomplete>\n\n                <md-autocomplete\n                        flex=\"30\"\n                        class=\"autocomplete-field-create-asset\"\n                        md-no-cache=\"true\"\n                        md-selected-item=\"model.assetType\"\n                        md-search-text=\"searchTextAssetType\"\n                        md-items=\"option in querySearch(searchTextAssetType, types, \'name\')\"\n                        md-item-text=\"option.name\"\n                        md-min-length=\"0\"\n                        md-floating-label=\"Select type\"\n                        required=\"true\">\n                    <md-item-template>\n                        <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                    </md-item-template>\n                    <md-not-found>\n                        No asset types found\n                    </md-not-found>\n                </md-autocomplete>\n\n\n                <md-input-container flex=\"40\" style=\"margin-top: 28px;\">\n                    <label>Asset ID</label>\n                    <input name=\"name\" ng-model=\"model.name\" required md-maxlength=\"10\" minlength=\"5\">\n                    <div ng-messages=\"form.name.$error\" ng-if=\"form.name.$dirty && form.name.$invalid\" role=\"alert\">\n                        <div ng-message=\'required\'>This is required!</div>\n                        <div ng-message=\'maxlength\'>That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n            </div>\n            <div layout=\"row\" layout-wrap>\n                <md-input-container flex=\"100\">\n                    <label>Description</label>\n                    <textarea name=\"description\" ng-model=\"model.meta.assetDescription\" required md-maxlength=\"90\"\n                              minlength=\"5\"></textarea>\n                    <div ng-messages=\"form.description.$error\"\n                         ng-if=\"form.description.$dirty && form.description.$invalid\" role=\"alert\">\n                        <div ng-message=\'required\'>This is required!</div>\n                        <div ng-message=\'maxlength\'>That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n            </div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\">Save</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/dashboard/create/hospitalSelection.html","<md-dialog flex=\"30\" flex-md=\"40\">\n    <ng-form name=\"form\">\n        <div layout=\"column\" layout-padding layout-margin>\n            <md-dialog-content layout-padding>\n                <div layout=\"row\" layout-wrap>\n                    <md-autocomplete\n                            flex=\"100\"\n                            layout-align=\"center none\"\n                            md-no-cache=\"true\"\n                            md-selected-item=\"model.hospital\"\n                            md-search-text=\"searchText\"\n                            md-items=\"option in querySearch(searchText)\"\n                            md-item-text=\"option.name\"\n                            md-min-length=\"0\"\n                            md-floating-label=\"Hospital\"\n                            required=\"true\">\n                        <md-item-template>\n                            <span md-highlight-flags=\"^i\">{{option.name}}</span>\n                        </md-item-template>\n                        <md-not-found>\n                            No hospitals found\n                        </md-not-found>\n                    </md-autocomplete>\n                </div>\n            </md-dialog-content>\n        </div>\n\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"proceed()\">Next</md-button>\n        </md-dialog-actions>\n    </ng-form>\n</md-dialog>");
$templateCache.put("js/dashboard/create/patient.html","<md-dialog  flex=\"50\">\n    <form name=\"form\">\n        <md-dialog-content layout-padding>\n            <div layout=\"row\"   layout-wrap>\n                <md-input-container flex=\"50\">\n                    <label>Select beacon</label>\n                    <md-select ng-model=\"model.roomId\">\n                        <md-option ng-repeat=\"option in formOptions.rooms\" value=\"{{option.id}}\">\n                            {{option.name}}\n                        </md-option>\n                    </md-select>\n                </md-input-container>\n\n                <md-input-container flex=\"50\">\n                    <label>UUID</label>\n                    <input name=\"uuid\" ng-model=\"model.uuid\" required md-maxlength=\"45\" minlength=\"10\">\n                    <div ng-messages=\"form.uuid.$error\" ng-if=\"form.uuid.$dirty && form.uuid.$invalid\" role=\"alert\">\n                        <div ng-message=\'required\'>This is required!</div>\n                        <div ng-message=\'maxlength\'>That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n            </div>\n            <div layout=\"row\"   layout-wrap>\n                <md-input-container flex=\"25\">\n                    <label>Select beacon</label>\n                    <md-select ng-model=\"model.roomId\">\n                        <md-option ng-repeat=\"option in formOptions.rooms\" value=\"{{option.id}}\">\n                            {{option.name}}\n                        </md-option>\n                    </md-select>\n                </md-input-container>\n                <md-input-container flex=\"25\">\n                    <label>Select beacon</label>\n                    <md-select ng-model=\"model.roomId\">\n                        <md-option ng-repeat=\"option in formOptions.rooms\" value=\"{{option.id}}\">\n                            {{option.name}}\n                        </md-option>\n                    </md-select>\n                </md-input-container>\n                <md-input-container flex=\"50\">\n                    <label>UUID</label>\n                    <input name=\"uuid\" ng-model=\"model.uuid\" required md-maxlength=\"45\" minlength=\"10\">\n                    <div ng-messages=\"form.uuid.$error\" ng-if=\"form.uuid.$dirty && form.uuid.$invalid\" role=\"alert\">\n                        <div ng-message=\'required\'>This is required!</div>\n                        <div ng-message=\'maxlength\'>That\'s too long!</div>\n                        <div ng-message=\"minlength\">That\'s too short!</div>\n                    </div>\n                </md-input-container>\n            </div>\n        </md-dialog-content>\n        <md-dialog-actions>\n            <md-button class=\"md-warn\" ng-click=\"close()\">Cancel</md-button>\n            <md-button class=\"md-primary\" ng-disabled=\"form.$invalid\" ng-click=\"save()\">Save</md-button>\n        </md-dialog-actions>\n    </form>\n</md-dialog>");
$templateCache.put("js/dashboard/directives/associateAction.html","<div class=\"md-whiteframe-6dp associate-form\" layout=\"row\" flex=\"100\" flex-md=\"80\" flex-sm=\"100\" flex-xs=\"100\">\n    <div flex=\"50\" class=\"availableBeacons\" layout=\"column\" layout-align=\"center center\">\n        <div class=\"label-available\" flex  layout-align=\"center center\" layout=\"column\">\n            Free\n        </div>\n        <div class=\"label-nr-available\" flex layout=\"row\">\n            <img class=\"available-beacons-icon\" src=\"img/beacons-01.png\" alt=\"Beacons\">\n            <div class=\"available-beacons-count\" ng-show=\"freeBeaconCount != \'\'\">{{freeBeaconCount}}</div>\n            <div class=\"available-beacons-count\" ng-show=\"freeBeaconCount == \'\'\">\n                <i class=\"zmdi zmdi-rotate-right zmdi-hc-spin\"></i>\n            </div>\n        </div>\n    </div>\n    <div flex=\"50\" layout=\"row\" class=\"allocate\">\n        <md-button flex=\"100\" class=\"inventory addBeaconsBtn\" ng-disabled=\"freeBeaconCount == 0\" ng-class=\"{\'disableBtn\' : freeBeaconCount == 0}\" layout-align=\"center center\" ng-click=\"addCallback(\'asset\')\">\n            <div class=\"allocateText\">allocate</div>\n            <i style=\"font-size: 6em\" class=\"zmdi zmdi-plus zmdi-hc-5x white\"></i>\n        </md-button>\n\n    </div>\n</div>");
$templateCache.put("js/dashboard/directives/filter.html","<div class=\"filter-area md-whiteframe-6dp\" layout=\"column\" layout-fill>\n    <div layout=\"row\">\n        <span class=\"filterPadding\">FILTER</span>\n        <span flex></span>\n        <md-button class=\"filter-button reset\" ng-click=\"resetFilters()\">\n            Reset\n        </md-button>\n        <md-button class=\"filter-button\" ng-click=\"applyFilters()\">\n            Apply\n        </md-button>\n    </div>\n    <div class=\"filters\" layout=\"row\" flex layout-wrap>\n        <md-input-container flex=\"20\">\n            <label>by Location</label>\n            <md-select ng-model=\"filter.room\" multiple>\n                <md-option disabled ng-if=\"filters.rooms.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"room in filters.rooms\" value=\"{{room.id}}\">\n                    <span ng-if=\"room.parent.name\">{{room.parent.name + \' - \'}}</span>\n                    {{room.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n        <md-input-container flex=\"auto\" ng-if=\"type==\'patient\'\">\n            <label>by Doctor</label>\n            <md-select ng-model=\"filter.doctor\">\n                <md-option ng-repeat=\"doctor in filters.doctors\" value=\"{{doctor.id}}\">\n                    {{doctor.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n        <md-input-container flex=\"20\" ng-if=\"type==\'asset\'\">\n            <label>by Type</label>\n            <md-select ng-model=\"filter.assetTypeId\" md-on-close=\"reloadStatuses(filter.assetTypeId)\">\n                <md-option disabled ng-if=\"filters.types.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"type in filters.types track by type.id\" value=\"{{type.id}}\">\n                    {{type.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n        <md-input-container flex=\"20\" ng-if=\"type==\'asset\'\">\n            <label>by Status</label>\n            <md-select ng-model=\"filter.status\" multiple>\n                <md-option disabled ng-if=\"filters.statuses.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"status in filters.statuses track by $index\" ng-value=\"status\">\n                    {{status.status || status}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n        <div flex=\"20\" flex-md=\"25\" flex-sm=\"100\" class=\"date-picker-filter\">\n            <md-datepicker ng-model=\"filter.entry\" md-placeholder=\"by Entry\" date-offset></md-datepicker>\n        </div>\n\n        <md-input-container flex=\"20\" flex-md=\"100\" flex-sm=\"100\" ng-if=\"ROLES.SAD\">\n            <label>by Hospital</label>\n            <md-select ng-model=\"filter.hospital\">\n                <md-option disabled ng-if=\"filters.hospitals.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"hospital in filters.hospitals | orderBy:\'name\'\" ng-value=\"hospital.id\">\n                    {{hospital.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n        <md-input-container flex=\"auto\" ng-if=\"type==\'patient\'\">\n            <label>by Surgery</label>\n            <md-select ng-model=\"filter.surgery\">\n                <md-option ng-repeat=\"surgery in filters.surgery_types\" value=\"{{surgery.id}}\">\n                    {{surgery.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n    </div>\n</div>");
$templateCache.put("js/dashboard/directives/free-text-search-form.html","<div class=\"md-whiteframe-1dp free-search-form free-text-search-form search-form-height\" flex=\"100\">\n    <div layout=\"row\">\n        <div class=\"input search-input\" layout-margin>\n            <md-input-container md-no-float layout=\"row\">\n                <i style=\"padding-right: 15px;\" class=\"zmdi zmdi-search zmdi-hc-2x\"></i>\n                <input flex=\"1\" name=\"text\" ng-model=\"search.text\" placeholder=\"Search...\"/>\n            </md-input-container>\n        </div>\n        <div flex></div>\n        <md-button class=\"filter-button reset btnMargin\" ng-click=\"reset()\">\n            Reset\n        </md-button>\n        <md-button class=\"filter-button btnMargin\" ng-click=\"search(search.text)\">\n            Apply\n        </md-button>\n    </div>\n</div>");
$templateCache.put("js/dashboard/view/asset.html","<md-dialog flex=\"50\" flex-md=\"65\" class=\"allocation-view\">\n    <md-dialog-content layout=\"column\" layout-padding ng-if=\"!isHistoryActive\">\n        <div layout=\"row\" style=\"padding-bottom: 30px;\">\n            <div class=\"meta\" layout=\"column\" flex=\"50\">\n                <div class=\"label\">ID</div>\n                <div class=\"value\">{{allocation.name}}</div>\n            </div>\n            <div class=\"meta inDateTime\" layout=\"column\" flex=\"50\">\n                <div class=\"label\">IN</div>\n                <div ng-if=\"allocation.entryDate\" class=\"value\">{{ allocation.entryDate | amDateFormat:\'MM/DD/YYYY hh:mm A\' }}</div>\n                <div ng-if=\"!allocation.entryDate\" class=\"value\">{{ \'-\' }}</div>\n            </div>\n        </div>\n        <div layout=\"row\">\n            <div class=\"meta\" layout=\"column\" flex=\"50\">\n                <div class=\"label\">Type</div>\n                <div class=\"value\">{{allocation.assetType.name}}</div>\n            </div>\n            <div class=\"meta room\" layout=\"column\" flex=\"50\" ng-style=\"{\'border-color\': allocation.room.color}\">\n                <div class=\"label\">Current Location</div>\n                <div class=\"value\">\n                    {{allocation.location.area}}\n                    <span ng-if=\"!allocation.location.area && !allocation.location.room\">UNKNOWN</span>\n                    <span ng-if=\"allocation.location.area && allocation.location.room\">, </span>\n                    {{allocation.location.room}}\n                </div>\n            </div>\n        </div>\n        <div layout=\"row\">\n            <div class=\"meta\" layout=\"column\" flex=\"100\">\n                <div class=\"label\">Description</div>\n                <div class=\"value\">{{allocation.meta.assetDescription}}</div>\n            </div>\n            <div class=\"meta status\" layout=\"column\" flex=\"50\">\n                <div class=\"label\">Status</div>\n                <div class=\"value\">{{allocation.status}}</div>\n            </div>\n        </div>\n        <div layout=\"row\" ng-if=\"ROLES.SAD\">\n            <div class=\"meta\" layout=\"column\" flex=\"50\">\n                <div class=\"label\">Hospital</div>\n                <div class=\"value\">{{allocation.hospital.name}}</div>\n            </div>\n        </div>\n    </md-dialog-content>\n    <md-dialog-content layout=\"column\" layout-padding ng-if=\"isHistoryActive\">\n        <div layout=\"row\" style=\"padding-bottom: 30px;\">\n            <div class=\"meta\" layout=\"column\" flex=\"50\">\n                <div class=\"label\">ID</div>\n                <div class=\"value\">{{allocation.name}}</div>\n            </div>\n            <div class=\"meta room\" layout=\"column\" ng-style=\"{\'border-color\': allocation.room.color}\" flex=\"50\">\n                <div class=\"label\">Current Location</div>\n                <div class=\"value\">\n                    {{allocation.location.area}}\n                    <span ng-if=\"!allocation.location.area && !allocation.location.room\">UNKNOWN</span>\n                    <span ng-if=\"allocation.location.area && allocation.location.room\">, </span>\n                    {{allocation.location.room}}\n                </div>\n            </div>\n        </div>\n        <div layout=\"row\">\n            <div class=\"meta\" layout=\"column\" flex=\"40\">\n                <div class=\"label name\">Name</div>\n            </div>\n            <div class=\"meta\" layout=\"column\" flex=\"30\">\n                <div class=\"label\">In</div>\n            </div>\n            <div class=\"meta\" layout=\"column\" flex=\"30\">\n                <div class=\"label\">Out</div>\n            </div>\n        </div>\n        <div class=\"allocation-history-container\" infinite-scroll=\'loadAllocationHistory()\' infinite-scroll-disabled=\'isInfiniteScrollDisabled\' infinite-scroll-distance=\'1\'>\n            <label class=\"noResultsLabel\" ng-if=\"allocation.history.length == 0\">No location history available</label>\n            <div layout=\"row\" class=\"history\" ng-repeat=\"item in allocation.history\">\n                <div class=\"room\" ng-style=\"{\'border-color\': allocation.room.color}\" flex=\"40\">\n                    <span ng-if=\"item.parentName && item.parentName.length > 0\">{{item.parentName + \', \'}}</span>{{ item.roomName }}\n                </div>\n                <div class=\"in\" flex=\"30\">\n                    {{ item.entryTime | amDateFormat:\'MM/DD/YYYY  h:mma\'}}\n                </div>\n                <div class=\"out\" flex=\"30\">\n                    {{ item.exitTime | amDateFormat:\'MM/DD/YYYY h:mma\' }}\n                </div>\n            </div>\n            <div ng-show=\'isBusyRequestingData\'>Loading history...</div>\n        </div>\n\n    </md-dialog-content>\n    <md-dialog-actions layout=\"row\">\n        <div class=\"view-actions-container\" style=\"padding: 0\" flex=\"20\" layout=\"row\" layout-align=\"center center\">\n            <md-button flex=\"90\" class=\"md-warn\" ng-click=\"close()\">\n                Close\n                <md-tooltip>Close</md-tooltip>\n            </md-button>\n        </div>\n        <div class=\"view-history-container\" flex-auto=\"\" layout=\"column\">\n            <md-button class=md-view-history\" ng-click=\"isHistoryActive=!isHistoryActive\" flex=\"100\">\n                {{ isHistoryActive ? \'Click to view details\' : \'Click to view location history\'}}\n            </md-button>\n        </div>\n        <div ng-if=\"ROLES.SAD || ROLES.HAD || ROLES.HCL\" class=\"view-actions-container\" flex=\"20\" layout=\"row\" layout-align=\"center center\">\n            <md-button class=\"md-icon-button edit-action\" ng-if=\"ROLES.SAD || ROLES.HAD || ROLES.HCL\" ng-click=\"openAllocationForm(\'asset\', allocation)\">\n                <md-tooltip>Edit</md-tooltip>\n                <i class=\"zmdi zmdi-edit zmdi-hc-2x special-blue\"></i>\n            </md-button>\n            <md-button class=\"md-icon-button md-warn\" ng-if=\"ROLES.SAD || ROLES.HAD || ROLES.HCL\" ng-click=\"discardCallback(allocation)\">\n                <md-tooltip>Discharge</md-tooltip>\n                <i class=\"zmdi zmdi-delete zmdi-hc-2x red\"></i>\n            </md-button>\n            <!--hidden btn because last button always gets hovered by default-->\n            <md-button ng-hide=\"true\"></md-button>\n        </div>\n    </md-dialog-actions>\n</md-dialog>");
$templateCache.put("js/dashboard/view/patient.html","TBI");
$templateCache.put("js/dictionary/directives/assetFilter.html","<div class=\"filter-area dictionary md-whiteframe-6dp\" layout=\"column\" layout-fill>\n    <div layout=\"row\">\n        <span class=\"searchLabel\">FILTER</span>\n        <span flex></span>\n        <md-button class=\"filter-button reset\" ng-click=\"resetFilters()\">\n            Reset\n        </md-button>\n        <md-button class=\"filter-button\" ng-click=\"applyFilters()\">\n            Apply\n        </md-button>\n    </div>\n    <div class=\"filters\" layout=\"row\" layout-wrap>\n        <md-input-container flex=\"auto\" ng-if=\"ROLES.SAD\">\n            <label>by Hospital</label>\n            <md-select ng-model=\"filter.hospital\">\n                <md-option disabled ng-if=\"filters.hospitals.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"hospital in filters.hospitals\" value=\"{{hospital.id}}\">\n                    {{hospital.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n        <md-input-container flex=\"auto\">\n            <label>by Default Status</label>\n            <md-select ng-model=\"filter.status\">\n                <md-option disabled ng-if=\"filters.statuses.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"defaultStatus in filters.statuses\" value=\"{{defaultStatus}}\">\n                    {{defaultStatus}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n    </div>\n</div>");
$templateCache.put("js/dictionary/directives/assets-search-form.html","<div class=\"md-whiteframe-6dp free-search-form free-text-search-form dictionary-search-padding\" layout=\"column\" layout-fill>\n    <div layout=\"row\">\n        <span class=\"searchLabelColor\" layout-margin>SEARCH</span>\n        <span flex></span>\n        <md-button class=\"filter-button reset\" ng-click=\"resetSearch()\">\n            Reset\n        </md-button>\n        <md-button class=\"filter-button\" ng-click=\"search(search.text)\">\n            Apply\n        </md-button>\n    </div>\n\n    <div class=\"input\" layout-margin>\n        <md-input-container layout=\"row\" class=\"searchBarWidth\" md-no-float>\n            <i class=\"zmdi zmdi-search zmdi-hc-2x\"></i>\n            <input name=\"text\" ng-model=\"search.text\" placeholder=\"Search...\"/>\n        </md-input-container>\n    </div>\n\n</div>");
$templateCache.put("js/dictionary/directives/dictionary-search-form.html","<div class=\"md-whiteframe-6dp free-search-form free-text-search-form dictionary-search-padding\" layout=\"column\" layout-fill>\n    <div layout=\"row\">\n        <span class=\"searchLabelColor\" layout-margin>SEARCH</span>\n        <span flex></span>\n        <md-button class=\"filter-button reset\" ng-click=\"resetSearch()\">\n            Reset\n        </md-button>\n        <md-button class=\"filter-button\" ng-click=\"search(search.text)\">\n            Apply\n        </md-button>\n    </div>\n\n    <div class=\"input\" layout-margin>\n        <md-input-container md-no-float layout=\"row\" class=\"searchBarWidth\">\n            <i class=\"zmdi zmdi-search zmdi-hc-2x\"></i>\n            <input name=\"text\" ng-model=\"search.text\" placeholder=\"Search...\"/>\n        </md-input-container>\n    </div>\n\n</div>");
$templateCache.put("js/dictionary/directives/dictionaryFilter.html","<div class=\"filter-area dictionary md-whiteframe-6dp\" layout=\"column\" layout-fill>\n    <div layout=\"row\">\n        <span class=\"searchLabel\">FILTER</span>\n        <span flex></span>\n        <md-button class=\"filter-button reset\" ng-click=\"resetFilters()\">\n            Reset\n        </md-button>\n        <md-button class=\"filter-button\" ng-click=\"applyFilters()\">\n            Apply\n        </md-button>\n    </div>\n    <div class=\"filters\" layout=\"row\" layout-wrap>\n        <md-input-container flex=\"auto\">\n            <label>by Component</label>\n            <md-select ng-model=\"filter.room\" multiple=\"true\">\n                <md-option disabled ng-if=\"filters.components.length == 0\">No items available</md-option>\n                <md-option ng-repeat=\"component in filters.components\" value=\"{{component.value}}\">\n                    {{component.name}}\n                </md-option>\n            </md-select>\n        </md-input-container>\n\n    </div>\n</div>");}]);
'use strict';

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

var allCountries = [
    [
        "United States",
        "us",
        "1",
        0
    ],
    [
        "Afghanistan (‫افغانستان‬‎)",
        "af",
        "93"
    ],
    [
        "Albania (Shqipëri)",
        "al",
        "355"
    ],
    [
        "Algeria (‫الجزائر‬‎)",
        "dz",
        "213"
    ],
    [
        "American Samoa",
        "as",
        "1684"
    ],
    [
        "Andorra",
        "ad",
        "376"
    ],
    [
        "Angola",
        "ao",
        "244"
    ],
    [
        "Anguilla",
        "ai",
        "1264"
    ],
    [
        "Antigua and Barbuda",
        "ag",
        "1268"
    ],
    [
        "Argentina",
        "ar",
        "54"
    ],
    [
        "Armenia (Հայաստան)",
        "am",
        "374"
    ],
    [
        "Aruba",
        "aw",
        "297"
    ],
    [
        "Australia",
        "au",
        "61",
        0
    ],
    [
        "Austria (Österreich)",
        "at",
        "43"
    ],
    [
        "Azerbaijan (Azərbaycan)",
        "az",
        "994"
    ],
    [
        "Bahamas",
        "bs",
        "1242"
    ],
    [
        "Bahrain (‫البحرين‬‎)",
        "bh",
        "973"
    ],
    [
        "Bangladesh (বাংলাদেশ)",
        "bd",
        "880"
    ],
    [
        "Barbados",
        "bb",
        "1246"
    ],
    [
        "Belarus (Беларусь)",
        "by",
        "375"
    ],
    [
        "Belgium (België)",
        "be",
        "32"
    ],
    [
        "Belize",
        "bz",
        "501"
    ],
    [
        "Benin (Bénin)",
        "bj",
        "229"
    ],
    [
        "Bermuda",
        "bm",
        "1441"
    ],
    [
        "Bhutan (འབྲུག)",
        "bt",
        "975"
    ],
    [
        "Bolivia",
        "bo",
        "591"
    ],
    [
        "Bosnia and Herzegovina (Босна и Херцеговина)",
        "ba",
        "387"
    ],
    [
        "Botswana",
        "bw",
        "267"
    ],
    [
        "Brazil (Brasil)",
        "br",
        "55"
    ],
    [
        "British Indian Ocean Territory",
        "io",
        "246"
    ],
    [
        "British Virgin Islands",
        "vg",
        "1284"
    ],
    [
        "Brunei",
        "bn",
        "673"
    ],
    [
        "Bulgaria (България)",
        "bg",
        "359"
    ],
    [
        "Burkina Faso",
        "bf",
        "226"
    ],
    [
        "Burundi (Uburundi)",
        "bi",
        "257"
    ],
    [
        "Cambodia (កម្ពុជា)",
        "kh",
        "855"
    ],
    [
        "Cameroon (Cameroun)",
        "cm",
        "237"
    ],
    [
        "Canada",
        "ca",
        "1",
        1,
        ["204", "226", "236", "249", "250", "289", "306", "343", "365", "387", "403", "416", "418", "431", "437", "438", "450", "506", "514", "519", "548", "579", "581", "587", "604", "613", "639", "647", "672", "705", "709", "742", "778", "780", "782", "807", "819", "825", "867", "873", "902", "905"]
    ],
    [
        "Cape Verde (Kabu Verdi)",
        "cv",
        "238"
    ],
    [
        "Caribbean Netherlands",
        "bq",
        "599",
        1
    ],
    [
        "Cayman Islands",
        "ky",
        "1345"
    ],
    [
        "Central African Republic (République centrafricaine)",
        "cf",
        "236"
    ],
    [
        "Chad (Tchad)",
        "td",
        "235"
    ],
    [
        "Chile",
        "cl",
        "56"
    ],
    [
        "China (中国)",
        "cn",
        "86"
    ],
    [
        "Christmas Island",
        "cx",
        "61",
        2
    ],
    [
        "Cocos (Keeling) Islands",
        "cc",
        "61",
        1
    ],
    [
        "Colombia",
        "co",
        "57"
    ],
    [
        "Comoros (‫جزر القمر‬‎)",
        "km",
        "269"
    ],
    [
        "Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)",
        "cd",
        "243"
    ],
    [
        "Congo (Republic) (Congo-Brazzaville)",
        "cg",
        "242"
    ],
    [
        "Cook Islands",
        "ck",
        "682"
    ],
    [
        "Costa Rica",
        "cr",
        "506"
    ],
    [
        "Côte d’Ivoire",
        "ci",
        "225"
    ],
    [
        "Croatia (Hrvatska)",
        "hr",
        "385"
    ],
    [
        "Cuba",
        "cu",
        "53"
    ],
    [
        "Curaçao",
        "cw",
        "599",
        0
    ],
    [
        "Cyprus (Κύπρος)",
        "cy",
        "357"
    ],
    [
        "Czech Republic (Česká republika)",
        "cz",
        "420"
    ],
    [
        "Denmark (Danmark)",
        "dk",
        "45"
    ],
    [
        "Djibouti",
        "dj",
        "253"
    ],
    [
        "Dominica",
        "dm",
        "1767"
    ],
    [
        "Dominican Republic (República Dominicana)",
        "do",
        "1",
        2,
        ["809", "829", "849"]
    ],
    [
        "Ecuador",
        "ec",
        "593"
    ],
    [
        "Egypt (‫مصر‬‎)",
        "eg",
        "20"
    ],
    [
        "El Salvador",
        "sv",
        "503"
    ],
    [
        "Equatorial Guinea (Guinea Ecuatorial)",
        "gq",
        "240"
    ],
    [
        "Eritrea",
        "er",
        "291"
    ],
    [
        "Estonia (Eesti)",
        "ee",
        "372"
    ],
    [
        "Ethiopia",
        "et",
        "251"
    ],
    [
        "Falkland Islands (Islas Malvinas)",
        "fk",
        "500"
    ],
    [
        "Faroe Islands (Føroyar)",
        "fo",
        "298"
    ],
    [
        "Fiji",
        "fj",
        "679"
    ],
    [
        "Finland (Suomi)",
        "fi",
        "358",
        0
    ],
    [
        "France",
        "fr",
        "33"
    ],
    [
        "French Guiana (Guyane française)",
        "gf",
        "594"
    ],
    [
        "French Polynesia (Polynésie française)",
        "pf",
        "689"
    ],
    [
        "Gabon",
        "ga",
        "241"
    ],
    [
        "Gambia",
        "gm",
        "220"
    ],
    [
        "Georgia (საქართველო)",
        "ge",
        "995"
    ],
    [
        "Germany (Deutschland)",
        "de",
        "49"
    ],
    [
        "Ghana (Gaana)",
        "gh",
        "233"
    ],
    [
        "Gibraltar",
        "gi",
        "350"
    ],
    [
        "Greece (Ελλάδα)",
        "gr",
        "30"
    ],
    [
        "Greenland (Kalaallit Nunaat)",
        "gl",
        "299"
    ],
    [
        "Grenada",
        "gd",
        "1473"
    ],
    [
        "Guadeloupe",
        "gp",
        "590",
        0
    ],
    [
        "Guam",
        "gu",
        "1671"
    ],
    [
        "Guatemala",
        "gt",
        "502"
    ],
    [
        "Guernsey",
        "gg",
        "44",
        1
    ],
    [
        "Guinea (Guinée)",
        "gn",
        "224"
    ],
    [
        "Guinea-Bissau (Guiné Bissau)",
        "gw",
        "245"
    ],
    [
        "Guyana",
        "gy",
        "592"
    ],
    [
        "Haiti",
        "ht",
        "509"
    ],
    [
        "Honduras",
        "hn",
        "504"
    ],
    [
        "Hong Kong (香港)",
        "hk",
        "852"
    ],
    [
        "Hungary (Magyarország)",
        "hu",
        "36"
    ],
    [
        "Iceland (Ísland)",
        "is",
        "354"
    ],
    [
        "India (भारत)",
        "in",
        "91"
    ],
    [
        "Indonesia",
        "id",
        "62"
    ],
    [
        "Iran (‫ایران‬‎)",
        "ir",
        "98"
    ],
    [
        "Iraq (‫العراق‬‎)",
        "iq",
        "964"
    ],
    [
        "Ireland",
        "ie",
        "353"
    ],
    [
        "Isle of Man",
        "im",
        "44",
        2
    ],
    [
        "Israel (‫ישראל‬‎)",
        "il",
        "972"
    ],
    [
        "Italy (Italia)",
        "it",
        "39",
        0
    ],
    [
        "Jamaica",
        "jm",
        "1876"
    ],
    [
        "Japan (日本)",
        "jp",
        "81"
    ],
    [
        "Jersey",
        "je",
        "44",
        3
    ],
    [
        "Jordan (‫الأردن‬‎)",
        "jo",
        "962"
    ],
    [
        "Kazakhstan (Казахстан)",
        "kz",
        "7",
        1
    ],
    [
        "Kenya",
        "ke",
        "254"
    ],
    [
        "Kiribati",
        "ki",
        "686"
    ],
    [
        "Kosovo",
        "xk",
        "383"
    ],
    [
        "Kuwait (‫الكويت‬‎)",
        "kw",
        "965"
    ],
    [
        "Kyrgyzstan (Кыргызстан)",
        "kg",
        "996"
    ],
    [
        "Laos (ລາວ)",
        "la",
        "856"
    ],
    [
        "Latvia (Latvija)",
        "lv",
        "371"
    ],
    [
        "Lebanon (‫لبنان‬‎)",
        "lb",
        "961"
    ],
    [
        "Lesotho",
        "ls",
        "266"
    ],
    [
        "Liberia",
        "lr",
        "231"
    ],
    [
        "Libya (‫ليبيا‬‎)",
        "ly",
        "218"
    ],
    [
        "Liechtenstein",
        "li",
        "423"
    ],
    [
        "Lithuania (Lietuva)",
        "lt",
        "370"
    ],
    [
        "Luxembourg",
        "lu",
        "352"
    ],
    [
        "Macau (澳門)",
        "mo",
        "853"
    ],
    [
        "Macedonia (FYROM) (Македонија)",
        "mk",
        "389"
    ],
    [
        "Madagascar (Madagasikara)",
        "mg",
        "261"
    ],
    [
        "Malawi",
        "mw",
        "265"
    ],
    [
        "Malaysia",
        "my",
        "60"
    ],
    [
        "Maldives",
        "mv",
        "960"
    ],
    [
        "Mali",
        "ml",
        "223"
    ],
    [
        "Malta",
        "mt",
        "356"
    ],
    [
        "Marshall Islands",
        "mh",
        "692"
    ],
    [
        "Martinique",
        "mq",
        "596"
    ],
    [
        "Mauritania (‫موريتانيا‬‎)",
        "mr",
        "222"
    ],
    [
        "Mauritius (Moris)",
        "mu",
        "230"
    ],
    [
        "Mayotte",
        "yt",
        "262",
        1
    ],
    [
        "Mexico (México)",
        "mx",
        "52"
    ],
    [
        "Micronesia",
        "fm",
        "691"
    ],
    [
        "Moldova (Republica Moldova)",
        "md",
        "373"
    ],
    [
        "Monaco",
        "mc",
        "377"
    ],
    [
        "Mongolia (Монгол)",
        "mn",
        "976"
    ],
    [
        "Montenegro (Crna Gora)",
        "me",
        "382"
    ],
    [
        "Montserrat",
        "ms",
        "1664"
    ],
    [
        "Morocco (‫المغرب‬‎)",
        "ma",
        "212",
        0
    ],
    [
        "Mozambique (Moçambique)",
        "mz",
        "258"
    ],
    [
        "Myanmar (Burma) (မြန်မာ)",
        "mm",
        "95"
    ],
    [
        "Namibia (Namibië)",
        "na",
        "264"
    ],
    [
        "Nauru",
        "nr",
        "674"
    ],
    [
        "Nepal (नेपाल)",
        "np",
        "977"
    ],
    [
        "Netherlands (Nederland)",
        "nl",
        "31"
    ],
    [
        "New Caledonia (Nouvelle-Calédonie)",
        "nc",
        "687"
    ],
    [
        "New Zealand",
        "nz",
        "64"
    ],
    [
        "Nicaragua",
        "ni",
        "505"
    ],
    [
        "Niger (Nijar)",
        "ne",
        "227"
    ],
    [
        "Nigeria",
        "ng",
        "234"
    ],
    [
        "Niue",
        "nu",
        "683"
    ],
    [
        "Norfolk Island",
        "nf",
        "672"
    ],
    [
        "North Korea (조선 민주주의 인민 공화국)",
        "kp",
        "850"
    ],
    [
        "Northern Mariana Islands",
        "mp",
        "1670"
    ],
    [
        "Norway (Norge)",
        "no",
        "47",
        0
    ],
    [
        "Oman (‫عُمان‬‎)",
        "om",
        "968"
    ],
    [
        "Pakistan (‫پاکستان‬‎)",
        "pk",
        "92"
    ],
    [
        "Palau",
        "pw",
        "680"
    ],
    [
        "Palestine (‫فلسطين‬‎)",
        "ps",
        "970"
    ],
    [
        "Panama (Panamá)",
        "pa",
        "507"
    ],
    [
        "Papua New Guinea",
        "pg",
        "675"
    ],
    [
        "Paraguay",
        "py",
        "595"
    ],
    [
        "Peru (Perú)",
        "pe",
        "51"
    ],
    [
        "Philippines",
        "ph",
        "63"
    ],
    [
        "Poland (Polska)",
        "pl",
        "48"
    ],
    [
        "Portugal",
        "pt",
        "351"
    ],
    [
        "Puerto Rico",
        "pr",
        "1",
        3,
        ["787", "939"]
    ],
    [
        "Qatar (‫قطر‬‎)",
        "qa",
        "974"
    ],
    [
        "Réunion (La Réunion)",
        "re",
        "262",
        0
    ],
    [
        "Romania (România)",
        "ro",
        "40"
    ],
    [
        "Russia (Россия)",
        "ru",
        "7",
        0
    ],
    [
        "Rwanda",
        "rw",
        "250"
    ],
    [
        "Saint Barthélemy",
        "bl",
        "590",
        1
    ],
    [
        "Saint Helena",
        "sh",
        "290"
    ],
    [
        "Saint Kitts and Nevis",
        "kn",
        "1869"
    ],
    [
        "Saint Lucia",
        "lc",
        "1758"
    ],
    [
        "Saint Martin (Saint-Martin (partie française))",
        "mf",
        "590",
        2
    ],
    [
        "Saint Pierre and Miquelon (Saint-Pierre-et-Miquelon)",
        "pm",
        "508"
    ],
    [
        "Saint Vincent and the Grenadines",
        "vc",
        "1784"
    ],
    [
        "Samoa",
        "ws",
        "685"
    ],
    [
        "San Marino",
        "sm",
        "378"
    ],
    [
        "São Tomé and Príncipe (São Tomé e Príncipe)",
        "st",
        "239"
    ],
    [
        "Saudi Arabia (‫المملكة العربية السعودية‬‎)",
        "sa",
        "966"
    ],
    [
        "Senegal (Sénégal)",
        "sn",
        "221"
    ],
    [
        "Serbia (Србија)",
        "rs",
        "381"
    ],
    [
        "Seychelles",
        "sc",
        "248"
    ],
    [
        "Sierra Leone",
        "sl",
        "232"
    ],
    [
        "Singapore",
        "sg",
        "65"
    ],
    [
        "Sint Maarten",
        "sx",
        "1721"
    ],
    [
        "Slovakia (Slovensko)",
        "sk",
        "421"
    ],
    [
        "Slovenia (Slovenija)",
        "si",
        "386"
    ],
    [
        "Solomon Islands",
        "sb",
        "677"
    ],
    [
        "Somalia (Soomaaliya)",
        "so",
        "252"
    ],
    [
        "South Africa",
        "za",
        "27"
    ],
    [
        "South Korea (대한민국)",
        "kr",
        "82"
    ],
    [
        "South Sudan (‫جنوب السودان‬‎)",
        "ss",
        "211"
    ],
    [
        "Spain (España)",
        "es",
        "34"
    ],
    [
        "Sri Lanka (ශ්‍රී ලංකාව)",
        "lk",
        "94"
    ],
    [
        "Sudan (‫السودان‬‎)",
        "sd",
        "249"
    ],
    [
        "Suriname",
        "sr",
        "597"
    ],
    [
        "Svalbard and Jan Mayen",
        "sj",
        "47",
        1
    ],
    [
        "Swaziland",
        "sz",
        "268"
    ],
    [
        "Sweden (Sverige)",
        "se",
        "46"
    ],
    [
        "Switzerland (Schweiz)",
        "ch",
        "41"
    ],
    [
        "Syria (‫سوريا‬‎)",
        "sy",
        "963"
    ],
    [
        "Taiwan (台灣)",
        "tw",
        "886"
    ],
    [
        "Tajikistan",
        "tj",
        "992"
    ],
    [
        "Tanzania",
        "tz",
        "255"
    ],
    [
        "Thailand (ไทย)",
        "th",
        "66"
    ],
    [
        "Timor-Leste",
        "tl",
        "670"
    ],
    [
        "Togo",
        "tg",
        "228"
    ],
    [
        "Tokelau",
        "tk",
        "690"
    ],
    [
        "Tonga",
        "to",
        "676"
    ],
    [
        "Trinidad and Tobago",
        "tt",
        "1868"
    ],
    [
        "Tunisia (‫تونس‬‎)",
        "tn",
        "216"
    ],
    [
        "Turkey (Türkiye)",
        "tr",
        "90"
    ],
    [
        "Turkmenistan",
        "tm",
        "993"
    ],
    [
        "Turks and Caicos Islands",
        "tc",
        "1649"
    ],
    [
        "Tuvalu",
        "tv",
        "688"
    ],
    [
        "U.S. Virgin Islands",
        "vi",
        "1340"
    ],
    [
        "Uganda",
        "ug",
        "256"
    ],
    [
        "Ukraine (Україна)",
        "ua",
        "380"
    ],
    [
        "United Arab Emirates (‫الإمارات العربية المتحدة‬‎)",
        "ae",
        "971"
    ],
    [
        "United Kingdom",
        "gb",
        "44",
        0
    ],
    [
        "Uruguay",
        "uy",
        "598"
    ],
    [
        "Uzbekistan (Oʻzbekiston)",
        "uz",
        "998"
    ],
    [
        "Vanuatu",
        "vu",
        "678"
    ],
    [
        "Vatican City (Città del Vaticano)",
        "va",
        "39",
        1
    ],
    [
        "Venezuela",
        "ve",
        "58"
    ],
    [
        "Vietnam (Việt Nam)",
        "vn",
        "84"
    ],
    [
        "Wallis and Futuna (Wallis-et-Futuna)",
        "wf",
        "681"
    ],
    [
        "Western Sahara (‫الصحراء الغربية‬‎)",
        "eh",
        "212",
        1
    ],
    [
        "Yemen (‫اليمن‬‎)",
        "ye",
        "967"
    ],
    [
        "Zambia",
        "zm",
        "260"
    ],
    [
        "Zimbabwe",
        "zw",
        "263"
    ],
    [
        "Åland Islands",
        "ax",
        "358",
        1
    ]
];

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:BeaconService
 * @description
 * Beacon service for getting information about beacons, and handling simple actions
 */
angular.module('ilWebClient').service('BeaconService', ['Restangular', '$http', 'API_URL', function (Restangular, $http, API_URL) {
    var self = this;
    self.service = Restangular.service('beacon/');

        /**
     * @ngdoc method
     * @name getCount
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Get count of available, free, and total beacons.
     *
     * @returns {object}    Promise that resolves into data from server
     */
    this.getCount = function () {
        return this.service.one().customGET('count');
    };


    /**
     * @ngdoc method
     * @name available
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Get a list of available beacons
     *
     * @returns {object}    Promise that resolves into data from server
     */
    this.available = function () {
        return this.service.one().customGET('available');
    };


    /**
     * @ngdoc method
     * @name availableCount
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Get a list of available beacons count
     *
     * @returns {object}    Promise that resolves into data from server
     */
    this.availableCount = function () {
        return this.service.one().customGET('available/count');
    };


    /**
     * @ngdoc method
     * @name start
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Start fingerprinting
     *
     * @param {object}  beacon  Beacon to start
     * @param {number}  roomId  Room ID  to start fingerprinting
     *
     * @returns {object}        Promise that resolves into data from server
     */
    this.start = function (beacon, roomId) {
        return self.service.one().customGET(beacon.id + '/fingerprint/start/' + roomId);
    };


    /**
     * @ngdoc method
     * @name stop
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Stop fingerprinting
     *
     * @param {object}  beacon  Beacon to stop
     *
     * @returns {object}        Promise that resolves into data from server
     */
    this.stop = function (beacon) {
        return self.service.one().customGET(beacon.id + '/fingerprint/stop/');
    };

    /**
     * @ngdoc method
     * @name loadByScannedData
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Gets beacon using MAC address
     *
     * @param {object}  macAddress  Beacon MAC address
     * @param {object}  major       Beacon major version
     * @param {object}  minor       Beacon minor version
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.loadByScannedData = function (macAddress, minor, major) {
        var url = [macAddress, minor, major];
        return self.service.one().customGET(url.join('/'));
    };

    /**
     * @ngdoc method
     * @name loadByScannedData
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Gets beacon using MAC address
     *
     * @param {object}  macAddress  Beacon MAC address
     * @param {object}  major       Beacon major version
     * @param {object}  minor       Beacon minor version
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.loadIbeaconByScannedData = function (macAddress) {
        var url = [macAddress];
        return self.service.one().customGET('ibeacon/'+url.join('/'));
    };

    /**
     * @ngdoc method
     * @name loadByScannedData
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Gets beacon using MAC address
     *
     * @param {object}  macAddress  Beacon MAC address
     * @param {object}  major       Beacon major version
     * @param {object}  minor       Beacon minor version
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.loadNearableByScannedData = function (nearableId) {
        var url = [nearableId];
        return self.service.one().customGET('nearable/'+ url.join('/'));
    };

    /**
     * @ngdoc method
     * @name loadBeaconUUID
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Gets beacon UUID by type
     *
     * @param {string}  beaconType  Beacon type
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.loadBeaconUUID = function (beaconType) {
        return self.service.one().customGET('uuid/' + beaconType);
    };

    /**
     * @ngdoc method
     * @name loadByIdHTTP
     * @methodOf ilWebClient.service:BeaconService
     * @description
     * Gets beacon via $http with ID
     *
     * @param {string}  beaconId    Beacon id
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.loadByIdHTTP = function (beaconId) {
        return $http({
            method: 'GET',
            url: API_URL + '/beacon/' + beaconId
        });
    }
}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:BeaconController
 * @description
 * Beacon CRUD controller
 */
angular.module('ilWebClient').controller('BeaconController', ['$scope', 'CrudFactory', 'UserService', '$mdDialog', 'BeaconService', 'Restangular', 'NotificationService', 'UtilService',
    function ($scope, CrudFactory, UserService, $mdDialog, BeaconService, Restangular, NotificationService, UtilService) {

        $scope.ROLES = UserService.getRoles();
        $scope.preActionHook = preActionHook;
        $scope.cannotDeleteItem = cannotDeleteItem;

        $scope.columns = {
            'name': {
                'name': 'Name',
                'orderBy': 'name',
                'getTooltip': function(item, column){
                    return item.allocationType ? item.allocationType + ": " + item.allocationName :
                        item.gatewayName ? ("Gateway: " + item.gatewayName) : "";
                }
            },
            'beaconType': {
                'name': 'Protocol',
                'orderBy': 'beaconType'
            },
            'uuid': {
                'name': 'uuid',
                getValue: function (item, column) {
                    return [item.uuid, item.major, item.minor].filter(function (val) {
                        return val;
                    }).join('/');
                }
            },
            'macAddr': {
                'name': 'MAC Address'
            },
            'nearableUUID': {
                'name': 'Identifier'
            },
            'status': {
                'name': 'status'
            },
            'batteryLevel': {
                'name': 'Battery'
            },
            'temperature':{
                'name':'temp'
            }
        };

        function startBeacon(beacon, room) {
            return callBeaconAction('start', beacon, room)
        }

        function stopBeacon(beacon) {
            return callBeaconAction('stop', beacon)
        }

        function callBeaconAction(action, beacon, roomId) {
            return BeaconService[action](beacon, roomId).then(function (updated) {
                switch (action) {
                    case 'start':
                        NotificationService.show('Fingerprinting started', 'success');
                        break;
                    case 'stop':
                        NotificationService.show('Fingerprinting stopped', 'success');
                        break;
                }
                $scope.$broadcast('crud.updated.beacon', updated)
            }, function (error) {
                UtilService.showErrorNotification(error, 'Error! Please try again later');
            })
        }

        function selectRoom(beacon) {
            var model = {};
            // NOTE: restService not important
            var restService = new CrudFactory.CrudRest('room');

            $mdDialog.show({
                templateUrl: 'js/beacon/room-selection.html',
                controller: 'RoomIntermediaryController',
                parent: angular.element(document.body),
                locals: {
                    model: Restangular.copy(model),
                    restService: restService
                },
                bindToController: true,
                escapeToClose: false,
                clickOutsideToClose: true,
                fullscreen: true
            })
                .then(function (result) {
                    startBeacon(beacon, result.roomId);
                }, function () {
                    // TODO: handle cancel
                });
        }


        var disableStart = function (beacon) {
            return (beacon.fingerprinting|| beacon.isFingerprinting) || !$scope.ROLES.SAD;
        };

        var disableStop = function (beacon) {
            return !(beacon.fingerprinting|| beacon.isFingerprinting) || !$scope.ROLES.SAD; 
        };

        $scope.actions = [
            {
                title: 'Start fingerprinting',
                action: 'start',
                icon: {
                    'zmdi-play': true
                },
                color: 'green',
                callback: selectRoom,
                shouldBeHidden: disableStart
            },
            {
                title: 'Stop fingerprinting',
                action: 'stop',
                icon: {
                    'zmdi-stop': true
                },
                color: 'red',
                callback: stopBeacon,
                shouldBeHidden: disableStop
            }
        ];

        $scope.filterConfig = {
            'status': {
                type: 'select',
                column: 'status',
                placeholder: 'by Status',
                allowMultipleSelection: true,
                values: []
            }
        };

        function updateBeaconStatuses() {
            var restService = new CrudFactory.CrudRest('beacon/status');
            restService.list().then(function (statusList) {
                statusList.forEach(function (item) {
                    $scope.filterConfig.status.values.push({
                        name: item,
                        value: item
                    });
                });
            });
        }

        function preActionHook(beacon, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    handleBeaconDeletion(beacon, resolve, reject);
                    break;
                case 'create':
                    resolve(beacon);
                    break;
                case 'edit':
                    handleBeaconEdit(beacon, resolve, reject);
                    break;
                default:
                    resolve(beacon);
            }
        }

        function handleBeaconEdit(beacon, resolve, reject) {
            BeaconService
                .loadByIdHTTP(beacon.id)
                .then(function (newBeacon) {
                    resolve(Restangular.restangularizeElement(null, newBeacon.data, 'beacon'));
                })
                .catch(function (error) {
                    reject(error);
                });
        }

        function handleBeaconDeletion(beacon, resolve, reject) {
            if (beacon.status === 'ALLOCATED' || beacon.status === 'UNDETECTED') {
                reject('Only available beacons can be removed');
            } else {
                resolve([beacon, 'beacon', null]);
            }
        }

        function cannotDeleteItem(beacon) {
            return (beacon.status === 'ALLOCATED' || beacon.status === 'UNDETECTED');
        }

        updateBeaconStatuses();
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:RoomIntermediaryController
 * @description
 * Room selection controller used for selecting rooms in a wizard
 */
angular.module('ilWebClient').controller('RoomIntermediaryController', ['$scope', '$mdDialog', 'restService', 'CrudFactory', 'AutocompleteHelperService',
    function ($scope, $mdDialog, restService, CrudFactory, AutocompleteHelperService) {
        $scope.close = $mdDialog.cancel;
        $scope.proceed = proceed;
        $scope.model = {};
        $scope.rooms = [];
        $scope.searchText = '';
        $scope.querySearch = querySearch;

        function proceed() {
            var result = {
                roomId: $scope.model.room.id
            };
            $mdDialog.hide(result);
        }

        function getRooms() {
            var restService = new CrudFactory.CrudRest('room');
            restService.list({hasParents: true}).then(function(result) {
                $scope.rooms = result;
            })
        }

        function querySearch(search) {
            var result = AutocompleteHelperService.filter($scope.searchText, $scope.rooms, 'name');
            return AutocompleteHelperService.querySearch(null, null, result);
        }

        getRooms();
    }]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:AutocompleteHelperService
 *
 * @description
 * Exposes methods for searching in real-time on autocomplete fields - for now searchs through local arrays.
 * Can be modified to search on server directly.
 */
angular.module('ilWebClient').factory('AutocompleteHelperService', ['Restangular', '$q', '$timeout', function (Restangular, $q, $timeout) {

    /**
     * Exposed API for AutocompleteHelperService
     * @type {object}
     */
    var autocompleteHelper = {
        querySearch: querySearch,
        filter: filter
    };

    /**
     * @ngdoc method
     * @name querySearch
     * @methodOf ilWebClient.service:AutocompleteHelperService
     * @description
     * Mockup function for future queries to server
     *
     * @param {string} query String to filter by
     * @param {string} endpoint Server endpoint to query
     * @param {object} resultToReturn OPTIONAL, if present just return this
     * @returns {object} promise A promise that resolves into the query
     */
    function querySearch(query, endpoint, resultToReturn) {
        var deferred = $q.defer();

        // TODO: clean implementation - for now simulating network call
        $timeout(function () {
            if (resultToReturn) {
                deferred.resolve(resultToReturn);
            }
        }, 100);

        return deferred.promise;
    }

    /**
     * @ngdoc method
     * @name filter
     * @methodOf ilWebClient.service:AutocompleteHelperService
     * @description
     * Filter an array by a search term on a certain property for each of its objects
     *
     * @param {string} query Object containing
     * @param {Array} arrayToFilter Array on which filtering is performed
     * @param {string} filterByThisProperty Object property to consider when filtering
     */
    function filter(query, arrayToFilter, filterByThisProperty) {
        return arrayToFilter.filter(function (state) {
            var lowercaseQuery = query ? query.toLowerCase() : '';
            var item = filterByThisProperty ? state[filterByThisProperty] : state;
            return (item.toLowerCase().indexOf(lowercaseQuery) === 0);
        });
    }

    return autocompleteHelper;
}]);

'use strict';

angular.module('ilWebClient').factory('Focus', ["$timeout", "$window", function ($timeout, $window) {
    return function (id) {
        // timeout makes sure that it is invoked after any other event has been triggered.
        // e.g. click events that need to run before the focus or
        // inputs elements that are in a disabled state but are enabled when those events
        // are triggered.
        $timeout(function () {
            var element = $window.document.getElementById(id);
            if (element) {
                element.focus();
            }
        });
    };
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:forceSelect
 * @scope
 * @restrict A
 *
 * @description
 * Forces md-autocomplete to select an item if search text matches its name, only when the md-autocomplete field is required.
 * Requires <md-autocomplete/> element to be placed on.
 *
 */
angular.module('ilWebClient').directive('forceSelect', [function () {
    return {
        require: 'mdAutocomplete',
        restrict: 'A',
        link: function (scope, element, attrs, autoComplete) {

            // wait for the autocomplete directive to be compiled
            function getInput() {
                return element.find('input').eq(0);
            }

            var listener = scope.$watch(getInput, function (input) {

                if (input.length) {
                    listener(); // self release

                    var ngModel = input.controller('ngModel');

                    // set validity when input loses focus
                    input.on('blur', function () {
                        if (!autoComplete.scope.selectedItem && autoComplete.isRequired) {
                            scope.$applyAsync(ngModel.$setValidity('required', false));
                        }
                    });
                }
            })
        }
    }
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:hospitalTheme
 * @scope
 * @restrict E
 *
 * @description
 * Adds theme styling to its element
 *
 */
angular.module('ilWebClient').directive('hospitalTheme', ['$compile', 'HospitalThemeService', function ($compile, HospitalThemeService) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            HospitalThemeService
                .loadTheme()
                .then(function(theme) {
                    // TODO: set actual color
                    element.attr('ng-style', "{'background-color': 'red'}");
                    $compile(element)(scope);
                })
                .catch(function(err) {

                });
        }
    };
}]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:HospitalThemeService
 * @description
 * Hospital theme loader service
 *
 */
angular.module('ilWebClient').service('HospitalThemeService', ['$http', '$timeout', '$q', 'API_URL', '$window', function ($http, $timeout, $q, API_URL, $window) {

    var theme = null;

    restoreTheme();

    return {
        loadTheme: loadTheme,
        clearTheme: clearTheme
    };

    function restoreTheme() {
        var restoredTheme = $window.localStorage.getItem('theme');
        if (restoredTheme) {
            theme = JSON.parse(restoredTheme);
        }
    }

    /**
     * @ngdoc method
     * @name clearTheme
     * @methodOf ilWebClient.service:HospitalThemeService
     * @description
     * Clears theme from local storage and memory
     */
    function clearTheme() {
        theme = null;
        $window.localStorage.removeItem('theme');
    }

    /**
     * @ngdoc method
     * @name loadTheme
     * @methodOf ilWebClient.service:HospitalThemeService
     * @description
     * Loads theme from local variable, or from server if local variable is null
     */
    function loadTheme() {

        var deferred = $q.defer();

        if (theme) {

            $timeout(function () {
                deferred.resolve(theme);
            }, 1);

            return deferred.promise;

        } else {
            $http.get(API_URL + '/user/theme')
                .then(function (response) {
                    theme = response.data;
                    $window.localStorage.setItem('theme', JSON.stringify(theme));
                    deferred.resolve(theme);
                }, function (err) {
                    deferred.reject(err);
                });

            return deferred.promise;

        }

    }

}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:lowercaseInput
 * @scope
 * @restrict A
 *
 * @description
 * Transforms user input to lowercase.
 * Requires ng-model to modify.
 *
 */
angular.module('ilWebClient').directive('lowercaseInput', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, modelCtrl) {

            modelCtrl.$parsers.push(function (inputValue) {

                var transformedInput = inputValue.toLowerCase().replace(/ /g, '');

                if (transformedInput != inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }

                return transformedInput;
            });
        }
    };
});

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:mdChips
 * @scope
 * @restrict E
 *
 * @description
 * Extends mdChips directive from Angular Material to support saving text on blur as a new chip.
 *
 */
angular.module('ilWebClient').directive('mdChips', function () {
    return {
        restrict: 'E',
        require: 'mdChips', // Extends the original mdChips directive
        link: function (scope, element, attributes, mdChipsCtrl) {
            mdChipsCtrl.onInputBlur = function () {
                this.inputHasFocus = false;

                // ADDED CODE
                var chipBuffer = this.getChipBuffer();
                if (chipBuffer != "") { // REQUIRED, OTHERWISE YOU'D GET A BLANK CHIP
                    this.appendChip(chipBuffer);
                    this.resetChipBuffer();
                }
                // - EOF - ADDED CODE
            };
        }
    }
});

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:scannerHandle
 * @scope
 * @restrict A
 *
 * @description
 * Calls function when enter key is pressed on input
 *
 */
angular.module('ilWebClient').directive('enterHandle', function () {
    return {
        link: function (scope, element, attrs) {
            element.bind("keydown", function (event) {
                var parsedText = getModelInput(scope, attrs);

                if(scope.model.beaconType && scope.model.beaconType == 'IBEACON' && event.which === 13){
                    scope.$apply(function (){
                        scope.$eval(attrs.enterHandle);
                    });
                    event.preventDefault();
                }else if(parsedText.indexOf("/") !== -1){
                    scope.model.beaconType = "IBEACON";
                }else if(event.which == 189 || event.which === 9 || event.which == 13 || event.which == 32 || event.which ==16 || event.which == 10) { //ignore dash,tabs,spaces,shift and enter keys
                        event.preventDefault();
                }else{
                    parsedText += event.key;
                    
                    var fields = parsedText.toUpperCase().split("ID:");
                    if(fields.length == 3 && fields[2].length == 32){
                        element[0].value = fields[1].substr(0, fields[1].length-2) + ":" + fields[2];
                        parsedText = "";
                        scope.$apply(function(){
                            scope.$eval(attrs.enterHandle);
                        })
                    }
                }
            });
        }
    }

    // We will use this function to let inputs handle parsing of keyboard input.
    // Otherwise, we will have to handle deletes etc.
    function getModelInput(scope, attrs) {
        if (attrs.mdSearchText) {
            return scope[attrs.mdSearchText];
        } else {
            // Only supporting ngModels defined as object.key
            var ngModelValues = attrs.ngModel.split('.');
            if (scope[ngModelValues[0]] && scope[ngModelValues[0]][ngModelValues[1]]) {
                return scope[ngModelValues[0]][ngModelValues[1]]
            }

            return "";
        }
    }
});

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:UtilService
 *
 * @description
 * Some utility functions for the rest of the app
 *
 */
angular.module('ilWebClient').service('UtilService', ['$mdDialog', 'Restangular', 'NotificationService', function ($mdDialog, Restangular, NotificationService) {

    return {
        openAlertModal: openAlertModal,
        loadRoomInfo: loadRoomInfo,
        numToMAC: numToMAC,
        joinGroupsWithSeparator: joinGroupsWithSeparator,
        showErrorNotification: showErrorNotification,
        stringToUUID: stringToUUID,
        getBeaconTypeFromQRCode: getBeaconTypeFromQRCode
    };

    /**
     * @ngdoc method
     * @name openAlertModal
     * @methodOf ilWebClient.service:UtilService
     * @description
     * Opens an alert modal to inform user of blocking an action
     *
     * @param {object}  options     Object containing title and body of modal
     * @param {object}  callback    Hook to call after closing dialog
     *
     */
    function openAlertModal(options, callback) {
        var confirmDialog = $mdDialog.alert()
            .title(options.title)
            .htmlContent('\<span class="modal-custom-body">' + options.body + '\</span>')
            .ariaLabel('Confirm')
            .ok('OK');
        $mdDialog.show(confirmDialog).then(function () {
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    /**
     * @ngdoc method
     * @name loadRoomInfo
     * @methodOf ilWebClient.service:UtilService
     * @description
     * Loads room fingerprinting info
     *
     * @param {object}  room        Room we want to load fingerprint info for
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function loadRoomInfo(room) {
        return Restangular.one('room/').customGET(room.id + '/fingerprints');
    }

    /**
     * @ngdoc method
     * @name numToMAC
     * @methodOf ilWebClient.service:UtilService
     * @description
     * Transforms encoded MAC address to standard format
     *
     * @param {string}  num     String representing encoded MAC address
     *
     * @returns {string}        MAC address format
     */
    function numToMAC(num) {
        num = typeof num === 'string' ? parseInt(num) : (typeof num === 'number' ? num : null);

        if (!num || isNaN(num)) {
            return '';
        }

        var symbolArr = num.toString(16).split('').reverse();

        if (symbolArr.length < 12) {
            for (var i = 0; i < 12 - symbolArr.length; i++) {
                symbolArr.push("0");
            }
        }

        for (var i = 1; i < symbolArr.length; i += 2) {
            var tmp = symbolArr[i];
            symbolArr[i] = symbolArr[i - 1];
            symbolArr[i - 1] = tmp;
        }

        return joinGroupsWithSeparator(symbolArr, 2, ':');
    }

    /**
     * @ngdoc method
     * @name joinGroupsWithSeparator
     * @methodOf ilWebClient.service:UtilService
     * @description
     * Adds separator in between array elements and joins them
     *
     * @param {Array}   array       Array with elements to join
     * @param {number}  groupSize   After how many elements to add separator
     * @param {string}  separator   Separator to insert
     *
     * @returns {string}            MAC address format
     */
    function joinGroupsWithSeparator(array, groupSize, separator) {
        var output = [];
        for (var i = 0; i < array.length; i++) {
            output.push(array[i].toUpperCase());
            if (i % groupSize !== 0 && i !== 0 && i !== array.length - 1) {
                output.push(separator);
            }
        }
        return output.join('');
    }

    /**
     * @ngdoc method
     * @name showErrorNotification
     * @methodOf ilWebClient.service:UtilService
     * @description
     * Shows error notification coming from the server, or default if server does not have a message set
     *
     * @param {Object}  error           Error object coming from the request
     * @param {string}  defaultMsg      Message to show if server does not have a response to give
     *
     */
    function showErrorNotification(error, defaultMsg) {
        if (error.data && error.data.webErrors) {
            for (var property in error.data.webErrors) {
                if (error.data.webErrors.hasOwnProperty(property)) {
                    NotificationService.show(error.data.webErrors[property][0], 'error');
                }
            }
        } else {
            NotificationService.show(defaultMsg, 'error');
        }
    }

    function stringToUUID(text){
        if(text.length == 36) return text;
        if(text.length !== 32) return "";
        return text.slice(0,8) + "-" + text.slice(8,12) + "-" + text.slice(12,16) + "-" + text.slice(16,20) + "-" + text.slice(20,32);
    }

    function getBeaconTypeFromQRCode(code){
        if (code && code.split('/').length == 3 ) {
            return 'IBEACON';
        }else if(code && (code.split(':').length == 3 || code.split("+").length == 3)){
            return 'NEARABLE';
        }else{
            return null;
        }
    }
}]);

'use strict';

//TODO: refactor this controller;

/**
 * @ngdoc controller
 * @name ilWebClient.controller:EntityFormController
 * @description
 * Entity controller used for handling entity create/update forms - contains general logic associated to these actions
 */
angular.module('ilWebClient').controller('EntityFormController', ['$scope', 'formOptions', 'model', '$mdDialog', 'restService', 'CrudFactory', 'NotificationService', 'UserService', 'AutocompleteHelperService', '$timeout', 'MSG', 'FlowService', 'UtilService', 'Focus', 'BeaconService', 'newBeaconForm', '$rootScope',
    function ($scope, formOptions, model, $mdDialog, restService, CrudFactory, NotificationService, UserService, AutocompleteHelperService, $timeout, MSG, FlowService, UtilService, Focus, BeaconService, newBeaconForm, $rootScope) {
        $scope.formOptions = formOptions;
        $scope.model = model || {};
        $scope.close = $mdDialog.cancel;
        $scope.save = save;
        $scope.saveSurvey = saveSurvey;
        $scope.moveItem = moveItem;
        $scope.resetSelect = resetSelect;
        $scope.resetUserPassword = resetUserPassword;
        $scope.isCheckboxAreaValid = isCheckboxAreaValid;
        $scope.validationErrors = null;
        //$scope.status = $scope.model.assetStatuses || [];
        //$scope.model.assetStatuses = {};
        $scope.disclaimer = MSG.FORM_UPDATE_DISCLAIMER;
        $scope.isEditMode = $scope.model.id ? true : false;
        $scope.model.sendNotification = $scope.isEditMode ? $scope.model.sendNotification : true;
        $scope.model.checkInactivity = $scope.model.checkInactivity != undefined ? $scope.model.checkInactivity : true;
        $scope.ROLES = UserService.getRoles();
        $scope.PERMISSIONS = UserService.getHospitalPermissions();
        $scope.hospitalIsNull = model.hospital == null;
        $scope.parentIsNull = model.parent == null;
        $scope.beaconTypes = [];
        $scope.beaconProcessingTypes = [];
        $scope.querySearch = querySearch;
        $scope.statusSearch = statusSearch;
        $scope.processingTypeSearch = processingTypeSearch;
        $scope.getFormattedArea = getFormattedArea;
        $scope.pickColor = pickColor;
        $scope.isColorSet = isColorSet;
        $scope.addQuestion = addQuestion;
        $scope.addFormedChip = addFormedChip;
        $scope.storeDeletedAnswer = storeDeletedAnswer;
        $scope.deletedAnswers = {};
        $scope.removeQuestion = removeQuestion;
        $scope.recreateSelect = true;
        $scope.roomsList = [];
        $scope.resetHospitalAssets = resetHospitalAssets;
        $scope.setBeaconInfo = setBeaconInfo;
        $scope.setNearableInfo = setNearableInfo;
        $scope.focusInput = focusInput;
        $scope.blockUUID = false;
        var deletedQuestions = [];

        $scope.acordionIsActive = false;
        $scope.savingEntity = false;

        if (newBeaconForm) {
            $scope.model.openNewBeaconForm = newBeaconForm;
        }

        function setBeaconInfo() {
            if (!$scope.model.macAddr || $scope.model.macAddr.split('/').length !== 3) {
                return;
            }
            var scannedInputArray = $scope.model.macAddr.split('/');

            $scope.blockUUID = true;
            BeaconService
                .loadBeaconUUID('EM_BEACON')
                .then(function (result) {
                    $scope.model.uuid = result.uuid;
                    $scope.model.name = result.name;
                    $scope.blockUUID = false;
                    if ($scope.model.openNewBeaconForm) {
                        save();
                    }
                })
                .catch(function () {
                    $scope.blockUUID = false;
                });

            $scope.model.macAddr = UtilService.numToMAC($scope.model.macAddr);
            $scope.model.minor = scannedInputArray[1];
            $scope.model.major = scannedInputArray[2];
        }

        function setNearableInfo() {
            var delim = ':';
            var scannedValue = document.getElementById("uuidInput").value;
            if (!scannedValue || scannedValue.split(delim).length !== 2) {
                return;
            }
            var scannedInputArray = scannedValue.split(delim);
            $scope.blockUUID = true;
            var uuid = UtilService.stringToUUID(scannedInputArray[1])
            $scope.model.nearableUUID = scannedInputArray[0];
            $timeout(function () {
                $scope.model.uuid = uuid;
                getNameFromServer();
            }, 500);
        }

        function getNameFromServer(){
            BeaconService
                .loadBeaconUUID('NEARABLE')
                .then(function (result) {
                    $scope.model.name = result.name;
                    $scope.blockUUID = false;
                    if ($scope.model.openNewBeaconForm) {
                        console.log($scope.model.uuid);
                        save();
                    }
                })
                .catch(function () {
                    $scope.blockUUID = false;
                });
        }

        function focusInput(id) {
            $timeout(function () {
                Focus(id);
            }, 500);
        }

        /**
         * @ngdoc method
         * @name saveSurvey
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Saves survey to server
         */
        function saveSurvey() {
            if ($scope.model.questions.length === 0) {
                NotificationService.show('Please add at least one question.', 'error');
            } else if (allAnswersDeleted($scope.model.questions)) {
                NotificationService.show('Please add at least one question.', 'error');
            } else {
                if (allQuestionsValid($scope.model.questions)) {
                    $scope.model.questions = $scope.model.questions.concat(deletedQuestions);
                    setQuestionIndex($scope.model.questions);
                    save();
                } else {
                    NotificationService.show('Please make sure all questions have answer options or free text set.', 'error');
                }

            }
        }

        /**
         * @ngdoc method
         * @name allAnswersDeleted
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Check if all answers are deleted in array
         *
         * @param {Array} array Array on which to check deletion status
         *
         * @returns {bool}      Are all deleted?
         */
        function allAnswersDeleted(array) {
            var allDeleted = true;
            array.forEach(function (item) {
                if (!item.isDeleted) {
                    return allDeleted = false;
                }
            });
            return allDeleted;
        }

        /**
         * @ngdoc method
         * @name save
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * General save function
         */
        function save() {
            $scope.validationErrors = null;
            addDeletedAnswers();
            var callback = $scope.model.id ? restService.update.bind(restService) : restService.create.bind(restService);
            if ($scope.model.macAddr === '') {
                $scope.model.macAddr = null;
            }
            if ($scope.model.beaconType && $scope.model.beaconType.toLowerCase() === 'ibeacon') {
                $scope.model.nearableUUID = null;
                $scope.model.uuid = UtilService.stringToUUID($scope.model.uuid)
            } else if ($scope.model.beaconType && $scope.model.beaconType.toLowerCase() === 'nearable') {
                $scope.model.macAddr = null;
                $scope.model.uuid = UtilService.stringToUUID($scope.model.uuid)
            }
            callback($scope.model)
                .then(function (successResponse) {
                    deletedQuestions = [];
                    var option = $scope.model.role ? 'User' : 'Item';
                    if ($scope.model.id) {
                        NotificationService.show(option + ' updated', 'success');
                    } else {
                        NotificationService.show(option + ' created', 'success');
                    }
                    if ($scope.model.openNewBeaconForm) {
                        $scope.model = {
                            openNewBeaconForm: true,
                            beaconType: $scope.model.beaconType
                        };
                        focusInput('macAddrInput');
                        $rootScope.$broadcast('crud.reload.beacon');
                    } else {
                        $mdDialog.hide($scope.model);
                    }
                }, function (failResponse) {
                    if (!failResponse.data.webErrors) {
                        NotificationService.show('Error! Please try again', 'error');
                    }
                    deletedQuestions = [];
                    $scope.validationErrors = failResponse.data.webErrors;
                })
        }


        /**
         * @ngdoc method
         * @name isCheckboxAreaValid
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Check if checkbox is valid
         *
         * @param {Array} components    Components object
         *
         * @returns {bool}              Is checkbox valid?
         */
        function isCheckboxAreaValid(components) {
            for (var property in components) {
                if (components.hasOwnProperty(property)) {
                    if (components[property]) {
                        return true;
                    }
                }
            }
            return false;
        }


        /**
         * @ngdoc method
         * @name resetUserPassword
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Reset user password
         *
         * @param {object} user     User object to reset password for
         */
        function resetUserPassword(user) {
            UserService
                .requestPasswordReset(user.email)
                .then(passwordResetSuccess)
                .catch(handleResetRequestError);
        }


        /**
         * @ngdoc method
         * @name passwordResetSuccess
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Password reset success callback - displays notification
         *
         * @param {object} result   Result callback is called with
         *
         */
        function passwordResetSuccess(result) {
            NotificationService.show('Email sent successfully', 'success');
            $mdDialog.cancel();
        }


        /**
         * @ngdoc method
         * @name handleResetRequestError
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Password reset error callback - displays notification
         *
         * @param {object} error   Result callback is called with
         *
         */
        function handleResetRequestError(error) {
            NotificationService.show('There was an error. Please try again', 'error');
        }


        /**
         * @ngdoc method
         * @name querySearch
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Search for objects in an array with text input
         *
         * @param {string}  search      Search string
         * @param {Array}   array       Array to filter on
         * @param {string}  prop        Property to filter on
         *
         * @returns {object}        Promise that eventually resolves with data from local storage/server
         */
        function querySearch(search, array, prop) {
            var result = AutocompleteHelperService.filter(search, array, prop);
            if ($scope.model.id) {
                for (var i = 0; i < result.length; i++) {
                    if (result[i].id && result[i].id === $scope.model.id) {
                        result.splice(i, 1);
                    }
                }
            }
            return AutocompleteHelperService.querySearch(null, null, result);
        }


        /**
         * @ngdoc method
         * @name resetSelect
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Reset dropdown select to initial state - workaround for Angular Material issue
         */
        function resetSelect() {
            $scope.recreateSelect = false;
            if ($scope.isEditMode) {
                $scope.model.assetTypes = null;
                $scope.model.assetStatus = null;
                $scope.model.assetStatuses = {};
                if ($scope.model.assetMappings.length && $scope.model.assetMappings[0]) {
                    if ($scope.model.assetMappings[0].assetStatus) {
                        $scope.model.assetMappings[0].assetStatus.id = null;
                    }
                    if ($scope.model.assetMappings[0].assetType) {
                        $scope.model.assetMappings[0].assetType.id = null;
                    }
                }
            }
            $timeout(function () {
                $scope.recreateSelect = true;
            }, 50);
        }


        /**
         * @ngdoc method
         * @name statusSearch
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Search for objects in an array with status input
         *
         * @param {string}  search      Search string
         * @param {Array}   array       Array to filter on
         *
         * @returns {object}        Promise that eventually resolves with data from local storage/server
         */
        function statusSearch(search, array) {
            var statusList = [];
            array.forEach(function (item) {
                statusList.push(item.status || item);
            });
            var result = AutocompleteHelperService.filter(search, statusList);
            return AutocompleteHelperService.querySearch(null, null, result);
        }

        /**
         * @ngdoc method
         * @name processingTypeSearch
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Search for objects in an array with processType input
         *
         * @param {string}  search      Search string
         * @param {Array}   array       Array to filter on
         *
         * @returns {object}        Promise that eventually resolves with data from local storage/server
         */
        function processingTypeSearch(search) {
            var result = AutocompleteHelperService.filter(search, $scope.beaconProcessingTypes);
            return AutocompleteHelperService.querySearch(null, null, result);
        }


        /**
         * @ngdoc method
         * @name getBeaconTypes
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Gets a list of beacon types
         */
        function getBeaconTypes() {
            var restService = new CrudFactory.CrudRest('beacon/type');
            restService.list().then(function (result) {
                $scope.beaconTypes = result;
            });
        }

        /**
         * @ngdoc method
         * @name getBeaconTypes
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Gets a list of beacon types
         */
        function getBeaconProcessingTypes() {
            var restService = new CrudFactory.CrudRest('/dictionary/beaconProcessingType/');
            restService.list().then(function (result) {
                $scope.beaconProcessingTypes = result;
            });
        }


        /**
         * @ngdoc method
         * @name getFormattedArea
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Gets formatted area name
         *
         * @param {object}   area   Area to have name formatted for displaying
         *
         * @returns {string}        Formatted area name
         */
        function getFormattedArea(area) {
            var name = area.name;
            if (area.parent && area.parent.name) {
                name += ' - ' + area.parent.name;
            }
            return name;
        }


        /**
         * @ngdoc method
         * @name pickColor
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Pick a color for an area
         *
         * @param {object}   color   Object with color information
         */
        function pickColor(color) {
            if (color.selected) {
                color.selected = false;
                $scope.model.color = null;
            } else {
                $scope.formOptions.colors.forEach(function (item) {
                    item.selected = false;
                });
                color.selected = true;
                $scope.model.color = color.hex;
            }
        }


        /**
         * @ngdoc method
         * @name checkExistingColor
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Check if color is set on model and highlight corresponding option
         */
        function checkExistingColor() {
            if ($scope.isEditMode && $scope.formOptions && $scope.formOptions.colors) {
                $scope.formOptions.colors.forEach(function (item) {
                    if ($scope.model.color === item.hex) {
                        item.selected = true;
                    }
                });
            }
        }


        /**
         * @ngdoc method
         * @name isColorSet
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Check if color is set
         *
         * @returns {boolean}   Color is set?
         */
        function isColorSet() {
            if (!$scope.formOptions.colors) {
                return false;
            }
            return $scope.model.color && $scope.model.color.length > 0;
        }


        /**
         * @ngdoc method
         * @name getParentRoomList
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Get list of rooms that are parents for other rooms
         */
        function getParentRoomList() {
            var restService = new CrudFactory.CrudRest('room');
            return restService.list({hasChildren: true}).then(function (rooms) {
                return rooms;
            });
        }


        /**
         * @ngdoc method
         * @name updateParentRoomList
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Refresh list of rooms that are parents for other rooms
         */
        function updateParentRoomList() {
            var restService = new CrudFactory.CrudRest('room');
            // filter to get all rooms that are either parent or standalone rooms
            var filter = {
                hasNoParentAndNoChildOrHasChildAndNoParent: true
            };
            if ($scope.model.hospital) {
                filter.hospital = $scope.model.hospital.id
            }
            restService.list(filter).then(function (rooms) {
                $scope.roomsList = rooms.plain();
            });
        }

        /**
         * @ngdoc method
         * @name addQuestion
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Add question to survey when editing
         */
        function addQuestion() {
            $scope.model.questions = $scope.model.questions || [];
            var newQuestion = {
                question: '',
                freeText: false,
                answers: []
            };
            if ($scope.isEditMode) {
                delete newQuestion.answers;
                newQuestion.predefinedAnswers = []
            }
            $scope.model.questions.push(newQuestion);
        }


        /**
         * @ngdoc method
         * @name addFormedChip
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Add formatted chip to answers when editing
         */
        function addFormedChip(text, question) {
            var paLength = question.predefinedAnswers.length;
            question.predefinedAnswers[paLength - 1] = {
                text: text
            };
        }


        /**
         * @ngdoc method
         * @name removeQuestion
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Remove question when editing
         */
        function removeQuestion(index) {
            if ($scope.model.questions[index].id) {
                $scope.model.questions[index].isDeleted = true;
                deletedQuestions.push($scope.model.questions[index]);
            }
            $scope.model.questions.splice(index, 1);
        }


        /**
         * @ngdoc method
         * @name storeDeletedAnswer
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Store a deleted answer for later submission to server
         *
         * @param {object}  answer      Answer that is being deleted
         * @param {object}  question    Question which contains the answer that is being deleted
         */
        function storeDeletedAnswer(answer, question) {
            if (answer.id) {
                answer.isDeleted = true;
                if (!$scope.deletedAnswers[question.id]) {
                    $scope.deletedAnswers[question.id] = [];
                }
                $scope.deletedAnswers[question.id].push(answer);
            }
        }


        /**
         * @ngdoc method
         * @name addDeletedAnswers
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Add deleted answers after editing and before submission for server to know which ones to remove
         */
        function addDeletedAnswers() {
            if ($scope.isEditMode && JSON.stringify($scope.deletedAnswers) != "{}") {
                for (var i = 0; i < $scope.model.questions.length; i++) {
                    if ($scope.deletedAnswers[$scope.model.questions[i].id]) {
                        $scope.model.questions[i].predefinedAnswers = $scope.model.questions[i].predefinedAnswers.concat($scope.deletedAnswers[$scope.model.questions[i].id]);
                    }
                }
            }
        }


        /**
         * @ngdoc method
         * @name updateRoomList
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Updates rooms list
         *
         * @param {number}  hospitalId  Hospital ID to get rooms for
         */
        function updateRoomList(hospitalId) {
            var restService = new CrudFactory.CrudRest('room');
            restService.list({hasChildren: false, hospital: hospitalId}).then(function (roomList) {
                $scope.formOptions.rooms = roomList;
            }, function (error) {
            });
        }


        /**
         * @ngdoc method
         * @name updateBeaconsList
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Updates beacons list
         *
         * @param {number}  hospitalId  Hospital ID to get beacons for
         */
        function updateBeaconsList(hospitalId) {
            var restService = new CrudFactory.CrudRest('beacon');
            restService.list({type: 'asset', status: 'AVAILABLE', hospital: hospitalId}).then(function (beaconList) {
                $scope.formOptions.beacons = beaconList;
            });
        }


        /**
         * @ngdoc method
         * @name resetHospitalAssets
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Reset hospital assets
         *
         * @param {number}  hospitalId  Hospital ID to reset assets for
         */
        function resetHospitalAssets(hospitalId) {
            $scope.model.controlBeacon = null;
            $scope.searchTextBeacons = null;
            $scope.model.room = null;
            $scope.searchTextRoom = null;
            if (hospitalId) {
                updateRoomList(hospitalId);
                updateBeaconsList(hospitalId);
            }
        }


        /**
         * @ngdoc method
         * @name moveItem
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Moves item from one array location to another
         *
         * @param {Array}   array   Array to modify
         * @param {number}  from    Original position in array
         * @param {number}  to      Destination position in array
         */
        function moveItem(array, from, to) {
            if (to < 0 || to >= array.length) {
                return;
            }
            array.splice(to, 0, array.splice(from, 1)[0]);
        }


        /**
         * @ngdoc method
         * @name allQuestionsValid
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Checks if all question/answers from a survey are valid before submitting to server
         *
         * @param {Array}   questionsArray      Array of questions and answers to validate
         *
         * @returns {boolean}                   Are all questions and answers valid?
         */
        function allQuestionsValid(questionsArray) {
            for (var i = 0; i < questionsArray.length; i++) {
                if (!questionsArray[i].isDeleted && !questionsArray[i].freeText &&
                    ((questionsArray[i].predefinedAnswers && questionsArray[i].predefinedAnswers.length === 0) || (questionsArray[i].answers && questionsArray[i].answers.length === 0))) {
                    return false;
                }
            }
            return true;
        }


        /**
         * @ngdoc method
         * @name setQuestionIndex
         * @methodOf ilWebClient.controller:EntityFormController
         * @description
         * Sets index property on question - required by server
         *
         * @param {Array}   questionsArray   Array of questions to modify
         */
        function setQuestionIndex(questionsArray) {
            var index = 1;
            for (var i = 0; i < questionsArray.length; i++) {
                delete questionsArray[i].index;
                if (!questionsArray[i].isDeleted) {
                    questionsArray[i].index = index;
                    index += 1;
                }
            }
        }


        updateParentRoomList();
        checkExistingColor();
        getBeaconTypes();
        getBeaconProcessingTypes()

    }]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:CrudFactory
 *
 * @description
 * General CRUD service for communication with the server on different entities
 */
angular.module('ilWebClient')
    .factory('CrudFactory', ['Restangular', '$http', 'API_URL',
        function (Restangular, $http, API_URL) {
            this.service = null;

            function CrudRest(resource) {
                this.resource = resource;
                this.service = Restangular.service(resource + '/');
            }


            /**
             * @ngdoc method
             * @name get
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - GET single object
             *
             * @param {object}  filter  Filter options
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.get = function (filter) {
                return this.service.one().customGET('', filter);
            };


            /**
             * @ngdoc method
             * @name list
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - GET collection of objects
             *
             * @param {object}  filter  Filter options
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.list = function (filter) {
                return this.service.getList(filter);
            };

            /**
             * @ngdoc method
             * @name getOne
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - GET single resource in collection by id
             *
             * @param {resource}  filter  Filter options
             *
             * @returns {object}        Promise that resolves into data from server
             */

            CrudRest.prototype.getOne = function (resource) {
                return this.service.one().customGET(resource.id);
            }

            /**
             * @ngdoc method
             * @name create
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - POST new object
             *
             * @param {object}  object  Object to create
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.create = function (object) {
                return this.service.post(object);
            };


            /**
             * @ngdoc method
             * @name update
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - PUT existing object
             *
             * @param {object}  object  Object to update
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.update = function (object) {
                return object.put();
            };

            /**
             * @ngdoc method
             * @name createWithFile
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - POST new object with file attached
             *
             * @param {object}  object  Object to create
             * @param {object}  file    File to add to object
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.createWithFile = function (object, file) {
                return $http({
                    method: 'POST',
                    url: API_URL + '/' + this.resource + '/',
                    withCredentials: false,
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: function (data) {
                        var formData = new FormData();
                        formData.append("model", angular.toJson(data.model));
                        if (data.file) {
                            formData.append("file", data.file);
                        }

                        return formData;
                    },
                    data: {
                        model: object.plain && typeof object.plain === 'function' ? object.plain() : object,
                        file: file
                    }
                });
            };

            /**
             * @ngdoc method
             * @name updateWithFile
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - PUT existing object with file attached
             *
             * @param {object}  object  Object to create
             * @param {object}  file    File to add to object
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.updateWithFile = function (object, file) {
                return $http({
                    method: 'PUT',
                    url: API_URL + '/' + this.resource + '/' + object.id,
                    withCredentials: false,
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: function (data) {
                        var formData = new FormData();
                        formData.append("model", angular.toJson(data.model));
                        if (data.file) {
                            formData.append("file", data.file);
                        }

                        return formData;
                    },
                    data: {
                        model: object.plain && typeof object.plain === 'function' ? object.plain() : object,
                        file: file
                    }
                });
            };


            /**
             * @ngdoc method
             * @name remove
             * @methodOf ilWebClient.service:CrudFactory
             * @description
             * CRUD - DELETE object
             *
             * @param {object}  object  Object to delete
             *
             * @returns {object}        Promise that resolves into data from server
             */
            CrudRest.prototype.remove = function (object) {
                return object.remove();
            };

            return {
                CrudRest: CrudRest
            }
        }
    ]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:crudList
 * @scope
 * @restrict E
 *
 * @description
 * A directive for handling CRUD-based operations on objects. Provides support for displaying paginated tables of items, sorting,
 * custom create/edit forms, query params and other common tasks.
 *
 */
angular.module('ilWebClient').directive('crudList', ['CrudFactory', '$mdDialog', 'Restangular', 'NotificationService', 'UserService', '$q', 'HospitalThemeService', '$rootScope','$state',
    function (CrudFactory, $mdDialog, Restangular, NotificationService, UserService, $q, HospitalThemeService, $rootScope, $state) {
        return {
            scope: {
                resource: '@',
                query: '=?query',
                columns: '=',
                buttons: '=',
                multiselect: '=',
                filterConfig: '=',
                createFormUrl: '@',
                uploadFormUrl: '@',
                uploadFormCtrl: '@',
                createFormBase: '@',
                createFormProperty: '@',
                canUploadFile: '=',
                formOptions: '=',
                actions: '=',
                customItemStyle: '=',
                preActionHook: '=',
                customFiltering: '=',
                getEndpoint: '=',
                forceGetObject: '=',
                cannotDeleteItemCb: '=',
                editController: '@',
                activeSelectionFilters: '=?',
                activeSearchFilters: '=?',
                editRoute: '='
            },
            restrict: 'E',
            templateUrl: 'js/crud/list.html',
            link: function (scope, element, attributes) {

                /**
                 * Item dialogs & modals
                 */
                scope.openEntityDialog = openEntityDialog;
                scope.editEntity = editEntity;
                scope.uploadFileDialog = uploadFileDialog;
                scope.remove = remove;
                scope.onDelete = onDelete;

                /**
                 * Search & filtering
                 */
                scope.search = search;
                scope.search.text = '';
                scope.resetSearch = resetSearch;
                scope.applyFilters = applyFilters;
                scope.resetFilters = resetFilters;

                /**
                 * Select all entities
                 */
                scope.toggleSelectAll = toggleSelectAll;
                scope.allEntitiesSelected = false;
                scope.showCheckbox = true;

                /**
                 * Pagination
                 */
                scope.totalCount = 0;
                scope.onPaginate = onPaginate;
                scope.onReorder = onReorder;

                /**
                 * Hospital theme
                 */
                scope.theme = null;

                /**
                 * Variables
                 */
                scope.isServerRequestActive = false;
                scope.activeSearchFilters = {};
                scope.activeSelectionFilters = {};
                scope.noResults = false;
                scope.existingFilter = {};
                scope.existingSearch = {};
                scope.ROLES = UserService.getRoles();
                scope.PERMISSIONS = UserService.getHospitalPermissions();

                /**
                 * Helpers
                 */
                var hadItemCollectionResults = false;
                scope.noFilterResults = false;

                var restService = new CrudFactory.CrudRest(scope.resource);

                if (scope.query == undefined) {
                    scope.query = {
                        order: '',
                        limit: 15,
                        page: 1
                    }
                }

                scope.cannotDeleteItem = function (item) {
                    if (scope.cannotDeleteItemCb && typeof scope.cannotDeleteItemCb === 'function') {
                        return scope.cannotDeleteItemCb(item);
                    }
                    return false;
                };

                HospitalThemeService
                    .loadTheme()
                    .then(function (theme) {
                        scope.theme = theme;
                    })
                    .catch(function (err) {
                        // TODO: handle error in loading theme
                    });

                scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                    $mdDialog.cancel()
                });

                getCollectionList();

                /**
                 * @ngdoc method
                 * @name getCollectionList
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Fetches and updates CRUD list display
                 */
                function getCollectionList() {
                    if (!scope.forceGetObject) {
                        getCollectionListCount();
                    }
                    scope.isServerRequestActive = true;
                    var getOperation = scope.forceGetObject == true ? restService.get(getQueryParams()) : restService.list(getQueryParams());
                    getOperation.then(function (result) {
                        if (scope.forceGetObject) {
                            scope.totalCount = result.count;
                            scope.itemCollection = Restangular.restangularizeCollection(null, result.values, scope.resource);

                        } else {
                            scope.itemCollection = result;
                        }
                        if (hadItemCollectionResults && (!isObjectEmpty(scope.activeSelectionFilters) || !isObjectEmpty(scope.activeSearchFilters))) {
                            scope.noFilterResults = scope.itemCollection.length == 0;
                        }
                        if (scope.itemCollection.length == 0) {
                            scope.noResults = !scope.noFilterResults;
                        } else {
                            hadItemCollectionResults = true;
                            scope.noResults = false;
                        }
                        scope.isServerRequestActive = false;
                    }, function () {
                        scope.isServerRequestActive = false;

                        if (scope.itemCollection) {
                            scope.noResults = scope.itemCollection.length == 0;
                        }
                    });
                }

                /**
                 * @ngdoc method
                 * @name toggleSelectAll
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Toggle selection on all entities in the table and emit of their ids
                 *
                 * @param {boolean} value - boolean to set on isChecked property of collection items
                 */
                function toggleSelectAll(value) {
                    scope.itemCollection.forEach(function (item) {
                        toggleItem(item, value);
                    });
                    scope.allEntitiesSelected = value;
                    reInitCheckox();
                    scope.$emit('crud.toggledItems.' + scope.resource, getSelectedItems());
                }

                /**
                 * @ngdoc method
                 * @name toggleItem
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Toggle a single item selection
                 *
                 * @param {object} item - object representing the item which we want to (de)select
                 * @param {boolean} isSelected - boolean to set on isChecked property of the item
                 */
                function toggleItem(item, isSelected) {
                    item.isChecked = isSelected;
                }

                /**
                 * @ngdoc method
                 * @name getSelectedItems
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Get all the IDs of selected items
                 */
                function getSelectedItems() {
                    var selectedItemIds = [];
                    scope.itemCollection.forEach(function (item) {
                        if (item.isChecked) {
                            selectedItemIds.push(item.id);
                        }
                    });
                    return selectedItemIds;
                }

                /**
                 * @ngdoc method
                 * @name getCollectionListCount
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Get total number of items in collection (with filters applied) for pagination to work
                 */
                function getCollectionListCount() {
                    var countService = new CrudFactory.CrudRest(scope.resource + '/count');
                    countService
                        .get(getQueryParams())
                        .then(function (result) {
                            scope.totalCount = result;
                        })
                        .catch(function (error) {
                            scope.totalCount = 0;
                        })
                }

                /**
                 * @ngdoc method
                 * @name onPaginate
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Called on new page requested
                 *
                 * @param {number} page - page to be requested from the server
                 * @param {number} limit - size of page
                 */
                function onPaginate(page, limit) {
                    scope.query.page = page;
                    scope.query.limit = limit;
                    toggleSelectAll(false);
                    getCollectionList();
                }

                /**
                 * @ngdoc method
                 * @name onReorder
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Called on reordering a collection by a certain property
                 *
                 * @param {string} order - ascending (propertyName) or descending (-propertyName)
                 */
                function onReorder(order) {
                    scope.query.order = order;
                    scope.query.page = 1;
                    getCollectionList();
                }

                /**
                 * @ngdoc method
                 * @name isObjectEmpty
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Utility function for determining if an object is empty or not
                 *
                 * @param {object} object - object to be checked if empty or not
                 * @returns {boolean} Result of the check
                 */
                function isObjectEmpty(object) {
                    for (var prop in object) {
                        if (object.hasOwnProperty(prop)) {
                            return false;
                        }
                    }
                    return true;
                }

                /**
                 * @ngdoc method
                 * @name capitalizeFirstLetter
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Utility function for capitalizing the first letter of a string
                 *
                 * @param {string} string - string to have first letter capitalized
                 * @returns {string} a string with the first letter uppercase
                 */
                function capitalizeFirstLetter(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                }

                /**
                 * @ngdoc method
                 * @name resetFilters
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Reset active filters and fetch the CRUD list
                 */
                function resetFilters() {
                    scope.activeSelectionFilters = {};
                    scope.allEntitiesSelected = false;
                    reInitCheckox();
                    if (isObjectEmpty(scope.activeSelectionFilters) && isObjectEmpty(scope.activeSearchFilters)) {
                        scope.noFilterResults = false;
                    }
                    getCollectionList();
                }

                /**
                 * @ngdoc method
                 * @name applyFilters
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Apply filters and fetch the crud list
                 */
                function applyFilters() {
                    if (scope.customFiltering) {
                        scope.activeSelectionFilters = scope.customFiltering(scope.activeSelectionFilters);
                    }
                    scope.query.page = 1;
                    getCollectionList();
                }

                /**
                 * @ngdoc method
                 * @name resetSearch
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Reset search and fetch the CRUD list
                 */
                function resetSearch() {
                    scope.search.text = '';
                    scope.allEntitiesSelected = false;
                    reInitCheckox();
                    scope.activeSearchFilters = {};
                    if (isObjectEmpty(scope.activeSelectionFilters) && isObjectEmpty(scope.activeSearchFilters)) {
                        scope.noFilterResults = false;
                    }
                    getCollectionList();
                }

                /**
                 * @ngdoc method
                 * @name reInitCheckox
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Workaround for unchecking a checkbox when its model changed value within the controller
                 */
                function reInitCheckox() {
                    scope.showCheckbox = false;
                    setTimeout(function () {
                        scope.showCheckbox = true;
                        scope.$apply();
                    }, 1);
                }

                /**
                 * @ngdoc method
                 * @name search
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Utility function for capitalizing the first letter of a string
                 *
                 * @param {object} searchQuery - object containing parameters of a query
                 */
                function search(searchQuery) {
                    scope.activeSearchFilters.name = searchQuery;
                    scope.query.page = 1;
                    getCollectionList();
                }

                /**
                 * @ngdoc method
                 * @name getQueryParams
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Get CRUD list query params
                 *
                 * @returns {object} An object with parameters composed from filter and search sections, if any
                 */
                function getQueryParams() {
                    var params = angular.extend({}, scope.query, scope.activeSearchFilters, scope.activeSelectionFilters);

                    /**
                     * Workaround for Angular issues with sending array params as multiple instances of same parameter
                     * Eg.: for property status = ["ACTIVE", "IDLE"], it would send http://api_url?status=ACTIVE&status=IDLE
                     * More info: https://github.com/angular/angular.js/pull/1364
                     */
                    for (var property in params) {
                        if (params.hasOwnProperty(property)) {
                            if (params[property].length) {
                                params[property] = params[property].toString();
                            }
                        }
                    }

                    return params;
                }

                /**
                 * @ngdoc method
                 * @name preAction
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Hook to run before an action (controllers may register to this hook or not, in which case it will resolve automatically)
                 *
                 * @param {object} item - object targeted by this action
                 * @param {string} actionName - action identifier by name
                 */
                function preAction(item, actionName) {
                    return $q(function (resolve, reject) {
                        if (typeof scope.preActionHook === 'function') {
                            scope.preActionHook(item, actionName, resolve, reject);
                        } else {
                            resolve(item);
                        }
                    })
                }

                /**
                 * @ngdoc method
                 * @name onDelete
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * When the delete button is pressed decide if user can delete entity or not
                 *
                 * @param {object} object - object to be deleted
                 */
                function onDelete(object) {
                    preAction(object, 'delete')
                        .then(function (result) {
                            if (result && result.length) {
                                remove.apply(this, result);
                            } else {
                                remove(result);
                            }
                        })
                        .catch(function (deniedMessage) {
                            if (deniedMessage && typeof deniedMessage === 'string') {
                                deleteNotAllowedMsg(deniedMessage);
                            }
                        });
                }

                /**
                 * @ngdoc method
                 * @name deleteNotAllowedMsg
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Show the user a message notifying him that the action is not permitted
                 *
                 * @param {object} msg - message to show to the user as a reason for not deleting
                 */
                function deleteNotAllowedMsg(msg) {
                    var notAllowedDialog = $mdDialog.alert()
                        .title('Action unavailable')
                        .htmlContent('\<span class="modal-custom-body">' + msg + '\</span>')
                        .ok('OK');
                    $mdDialog.show(notAllowedDialog);
                }

                /**
                 * Show the delete confirmation CRUD
                 * @param object
                 * @param resourceName
                 * @param message
                 */

                /**
                 * @ngdoc method
                 * @name remove
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Show the delete confirmation CRUD
                 *
                 * @param {object} object - object to remove
                 * @param {string} resourceName - name of item  to show in interface
                 * @param {string} message - message to show to the user
                 */
                function remove(object, resourceName, message) {

                    message = message || 'The resource will not be accessible anymore';
                    resourceName = resourceName || 'item';

                    var confirmDialog = $mdDialog
                        .confirm()
                        .title('Are you sure you want to remove this ' + resourceName + '?')
                        .htmlContent('\<span class="modal-custom-body">' + message + '\</span>')
                        .ariaLabel('Delete item')
                        .ok('Yes')
                        .cancel('No');

                    $mdDialog.show(confirmDialog)
                        .then(function () {
                            scope.isServerRequestActive = true;
                            restService.remove(object).then(function () {
                                NotificationService.show(capitalizeFirstLetter(resourceName) + ' removed', 'success');
                                scope.isServerRequestActive = false;
                                getCollectionList();
                                scope.$emit('crud.deleted.' + scope.resource);
                            }, function (response) {
                                NotificationService.show('Error! Please try again', 'error');
                                scope.isServerRequestActive = false;

                                // TODO: determine error order and handling needs

                                if (response.status === 400) {
                                    if (Object.keys(response.data.webErrors).length > 0) {
                                        for (var property in response.data.webErrors) {
                                            if (response.data.webErrors.hasOwnProperty(property)) {
                                                deleteNotAllowedMsg(response.data.webErrors[property][0]);
                                                break;
                                            }
                                        }
                                    } else {
                                        deleteNotAllowedMsg('You cannot delete this item');
                                    }
                                }
                            });
                        });
                }

                /**
                 * Listen to the update resource event from other parts of the application
                 * Should be deprecated as is not correct
                 */
                scope.$on('crud.updated.' + scope.resource, function (event, newObject) {
                    scope.itemCollection = scope.itemCollection || [];
                    var foundItemIndex = scope.itemCollection.map(function (item) {
                        return item.id
                    }).indexOf(newObject.id);
                    if (foundItemIndex !== -1) {
                        scope.itemCollection[foundItemIndex] = newObject
                    } else {
                        getCollectionList();
                    }
                });

                /**
                 * Listen to the update resource event from other parts of the application
                 */
                scope.$on('gateway.update', function (event, newObject) {
                    scope.itemCollection = scope.itemCollection || [];
                    var foundItemIndex = scope.itemCollection.map(function (item) {
                        return item.id
                    }).indexOf(newObject.id);
                    if (foundItemIndex !== -1) {
                        scope.itemCollection[foundItemIndex] = newObject
                    } else {
                        if(scope.query.limit > scope.itemCollection.length) scope.itemCollection.push(newObject);
                        getCollectionListCount();
                    }
                });

                scope.$on('gateway.remove', function (event, deletedObject) {
                    if (!deletedObject || !deletedObject.id) {
                        return
                    };
                    var foundItemIndex = scope.itemCollection.map(function (item) {
                        return item.id
                    }).indexOf(deletedObject.id);
                    if (foundItemIndex !== -1) {
                        scope.itemCollection.splice(foundItemIndex,1);
                        getCollectionListCount();
                    }
                    //getCollectionList()
                    //scope.itemCollection = scope.itemCollection || [];
                    //scope.itemCollection = scope.itemCollection.filter(function (item) {
                    //    return item.uuid ? item.uuid !== deletedObject.uuid : item.id !== deletedObject.id;
                    //});
                })

                scope.$on('crud.reload.' + scope.resource, function (event, newObject) {
                    getCollectionList();
                });

                scope.$on('crud.deleted.' + scope.resource, function (event, deletedObject) {
                    if (!deletedObject || !deletedObject.id) {
                        return
                    };
                    getCollectionList()
                    //scope.itemCollection = scope.itemCollection || [];
                    //scope.itemCollection = scope.itemCollection.filter(function (item) {
                    //    return item.uuid ? item.uuid !== deletedObject.uuid : item.id !== deletedObject.id;
                    //});
                })
                
                /**
                 * @ngdoc method
                 * @name openEntityDialog
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Open the edit Screen for the given model
                 *
                 * @param {object} model - object for which the create/edit modal is opening
                 */
                function openEntityDialog(model) {
                    var action = model.id ? 'edit' : 'create';
                    preAction(model, action)
                        .then(function (result) {
                            entityDialog(result);
                        })
                        .catch(function (message) {
                            deleteNotAllowedMsg(message);
                        });
                }

                function editEntity(model){
                    if(scope.editRoute){
                        $state.go(scope.editRoute, {'floor': model.id});
                    }else{
                        openEntityDialog(model);
                    }
                }

                /**
                 * @ngdoc method
                 * @name entityDialog
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Once the pre-edit/create hook finishes open the edit/create modal
                 *
                 * @param {object} model - object for which the create/edit modal is opening
                 */
                function entityDialog(model, newBeaconForm) {
                    scope.$emit('crud.dialog.open.' + scope.resource, model);
                    model = model || {};

                    $mdDialog.show({
                            templateUrl: scope.createFormUrl,
                            controller: scope.editController || 'EntityFormController',
                            parent: angular.element(document.body),
                            scope: scope.editController ? scope.$new() : $rootScope.$new(),
                            locals: {
                                model: Restangular.copy(model),
                                formOptions: scope.formOptions,
                                restService: restService,
                                newBeaconForm: newBeaconForm || false
                            },
                            bindToController: true,
                            escapeToClose: false,
                            fullscreen: true
                        })
                        .then(function (result) {

                            getCollectionList();

                            var requestNewBeacon = false;
                            if (result.openNewBeaconForm) {
                                delete result.openNewBeaconForm;
                                requestNewBeacon = true;
                            }

                            var event = result.id ? 'updated' : 'created';
                            scope.$emit('crud.' + event + '.' + scope.resource, result);
                            scope.$emit('crud.dialog.close.' + scope.resource, model);

                            if (requestNewBeacon) {
                                entityDialog(null, true);
                            }

                        }, function () {
                            scope.$emit('crud.dialog.close.' + scope.resource, model);
                        });
                }

                /**
                 * @ngdoc method
                 * @name uploadFileDialog
                 * @methodOf ilWebClient.directive:crudList
                 * @description
                 * Load file upload template and controller for batch imports
                 */
                function uploadFileDialog() {
                    $mdDialog.show({
                            templateUrl: scope.uploadFormUrl,
                            controller: scope.uploadFormCtrl,
                            parent: angular.element(document.body),
                            locals: {
                                resource: scope.resource
                            },
                            bindToController: true,
                            escapeToClose: false,
                            fullscreen: true
                        })
                        .then(function (result) {
                            if (result.needsRefresh) {
                                getCollectionList();
                            }
                        }, function () {
                            getCollectionList();
                            //TODO: any cleanup after cancel
                        });
                }

                // New implementation
                scope.onFiltersApplied = function(appliedFilters) {
                    scope.activeSearchFilters.name = appliedFilters.search;
                    scope.activeSelectionFilters = appliedFilters.filters;
                    
                    if (scope.customFiltering) {
                        scope.activeSelectionFilters = scope.customFiltering(scope.activeSelectionFilters);
                    }
                    scope.query.page = 1;
                    getCollectionList();
                }
            }
        }
    }
]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:CrudService
 *
 * @description
 * CRUD helper service
 *
 */
angular.module('ilWebClient').service('CrudService', ['Restangular', function (Restangular) {
    this.service = null;
    var self = this;


    /**
     * @ngdoc method
     * @name setEndPoint
     * @methodOf ilWebClient.service:CrudService
     * @description
     * Set resources base end point
     *
     * @param {string}      endpoint    Endpoint to set when operating CRUD methods
     * @returns {object}    Restangular service
     */
    this.setEndPoint = function (endpoint) {
        self.service = Restangular.service(endpoint + '/');
        return self.service;
    };

    
    /**
     * @ngdoc method
     * @name list
     * @methodOf ilWebClient.service:CrudService
     * @description
     * List objects that have the filter properties
     *
     * @param {object}      filter      Object containing the filtering config
     * @returns {object}    promise     Promise that resolves into data from server
     */
    this.list = function (filter) {
        return self.service.getList(filter);
    };


    /**
     * @ngdoc method
     * @name create
     * @methodOf ilWebClient.service:CrudService
     * @description
     * Create new object on server
     *
     * @param {object}      object      Object to be created
     * @returns {object}    promise     Promise that resolves into data from server
     */
    this.create = function (object) {
        return self.service.post(object);
    };


    /**
     * @ngdoc method
     * @name update
     * @methodOf ilWebClient.service:CrudService
     * @description
     * Update an object on the server
     *
     * @param {object}      object      Object to be updated
     * @returns {object}    promise     Promise that resolves into data from server
     */
    this.update = function (object) {
        return object.put();
    };


    /**
     * @ngdoc method
     * @name remove
     * @methodOf ilWebClient.service:CrudService
     * @description
     * Delete an object from the server
     *
     * @param {object}      object      Object to be deleted
     * @returns {object}    promise     Promise that resolves into data from server
     */
    this.remove = function (object) {
        return object.remove();
    }
}]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:BeaconAllocationService
 *
 * @description
 * Helper service for handling allocation-related actions
 *
 */
angular.module('ilWebClient').service('BeaconAllocationService', ['Restangular', function (Restangular) {
    this.service = Restangular.service('beacon-allocation');

    /**
     * @ngdoc method
     * @name deallocate
     * @methodOf ilWebClient.service:BeaconAllocationService
     * @description
     * Deallocate an existing allocation
     *
     * @param {object}  allocation  Allocation object to deallocate
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.deallocate = function (allocation) {
        return allocation.customGET('deallocate');
    };

    /**
     * @ngdoc method
     * @name getAllocation
     * @methodOf ilWebClient.service:BeaconAllocationService
     * @description
     * Get a single raw allocation object from the server
     *
     * @param {object}  allocation  Allocation object to get raw data for
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.getAllocation = function (allocation) {
        return this.service.one().customGET(allocation.allocationId || allocation.id);
    };

    /**
     * @ngdoc method
     * @name refreshAllocation
     * @methodOf ilWebClient.service:BeaconAllocationService
     * @description
     * Refreshes inactive allocation
     *
     * @param {object}  allocation  Allocation object to refresh
     *
     * @returns {object}            Promise that resolves into data from server
     */
    this.refreshAllocation = function (allocation) {
        return this.service.one().customGET((allocation.allocationId || allocation.id) + '/track');
    };
    this.getAllocationMap = function (allocation) {
        return this.service.one().customGET((allocation.allocationId || allocation.id) + '/map/feature', {roomName: allocation.location.room})
    }

}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:DashboardController
 * @description
 * Main dashboard controller used for displaying asset and patient dashboard
 */
(function() {
    DashboardController.$inject = ["$scope", "$state", "$transitions", "$mdDialog", "BeaconService", "CrudFactory", "BeaconAllocationService", "SocketService", "NotificationService", "UserService", "SOCKET_TOPICS", "HospitalThemeService", "$filter", "FilterRetrievalService"];
    angular.module('ilWebClient')
        .config(['$stateProvider', 'ROLES', function($stateProvider, ROLES) {
            $stateProvider
            .state('main.dashboard', {
                url: "/dasboard",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD, ROLES.HCL, ROLES.PER, ROLES.GPER],
                views: {
                    "content@main": {
                        templateUrl: "js/dashboard/dashboard.html",
                        controller: "DashboardController",
                        controllerAs: "dashboard"
                    }
                },
            })
        }])
        .controller('DashboardController', DashboardController);   

    function DashboardController($scope, $state, $transitions, $mdDialog, BeaconService, CrudFactory, BeaconAllocationService, SocketService, NotificationService, UserService, SOCKET_TOPICS, HospitalThemeService, $filter, FilterRetrievalService) {
        var dashboard = this;
        dashboard.filters = [];
        dashboard.availableCount = 0;
        dashboard.usedCount = 0;
        dashboard.useCardView = true;
        dashboard.PERMISSIONS = UserService.getHospitalPermissions();

        dashboard.tabs = [];
        if (dashboard.PERMISSIONS.atrak) {
            dashboard.tabs.push({
                label: 'Assets',
                route: 'main.dashboard.assets'
            });
        }

        if (dashboard.PERMISSIONS.ptrak) {
            dashboard.tabs.push({
                label: 'Patients',
                route: 'main.dashboard.patients'
            });
        }

        dashboard.gridTableToggle = function(state) {
            dashboard.useCardView = state;
        }

        dashboard.onFiltersApplied = function(appliedFilters) {
            dashboard.currentFilter = {
                page: 1,
                limit: 30,
                type: $state.current.name === 'main.dashboard.assets' ? 'asset' : 'patient',
                status: appliedFilters.status,
                room: appliedFilters.room,
                doctor: appliedFilters.doctor,
                assetTypeId: appliedFilters.type[0] ? "" + appliedFilters.type[0] : undefined,
                searchContent: appliedFilters.searchContent
            };
        }

        dashboard.openAllocationForm = function(type, model) {
            if (model) {
                BeaconAllocationService
                    .getAllocation(model)
                    .then(function (result) {
                        pushBeaconIntoOptions(result.beacon);
                        openAllocationModal(result);
                    }, function (error) {
                        getAvailableBeacons();
                    });
            } else {
                openAllocationModal(model);
            }
        }
        
        function openAllocationModal(model) {
            var type = $state.current.name === 'main.dashboard.assets' ? 'asset' : 'patient';
            $mdDialog.show({
                    templateUrl: 'js/dashboard/create/' + type + '.html',
                    parent: angular.element(document.body),
                    controller: type.capitalizeFirstLetter() + 'FormController',
                    locals: {
                        model: model || {},
                        beacons: BeaconService.available()
                    },
                    bindToController: true,
                    escapeToClose: false,
                    fullscreen: true,
                    clickOutsideToClose: true
                })
                .then(function (result) {
                    $scope.page = 1;
                    $scope.filter.page = 1;
                    $scope.allocations = [];
                    updateAllocationList();
                    getAvailableBeacons();
                }, function () {
                    getAvailableBeacons();
                    //TODO: any cleanup after cancel
                });
        }

        $transitions.onSuccess({to: 'main.dashboard.*'}, function(transition){
            var stateService = transition.router.stateService;

            dashboard.filters = [];
            dashboard.currentFilter = {
                page: 1,
                limit: 30,
                type: stateService.current.name === 'main.dashboard.assets' ? 'asset' : 'patient'
            }

            FilterRetrievalService.getFiltersForState(stateService.current.name)
            .then(function(filters) {
                dashboard.filters = filters;
            })
            .catch(function() {
                console.log('State not supported for filters: ' + stateService.current.name);
            });
        });


        $scope.beacons = [];
        $scope.noAssets = false;
        $scope.allocations = [];

        /**
         * Page number to be requested from server
         * @type {number}
         */
        $scope.page = 1;

        /**
         * Maximum number of results to be included by the server in its response
         * @type {number}
         */
        $scope.limit = 30;//page size

        $scope.filter = {page: $scope.page, limit: $scope.limit};
        $scope.filterAssetTypeName  = null;
        $scope.query = {};
        $scope.ROLES = UserService.getRoles();

        $scope.hadAllocationResults = false;
        $scope.allocationUpdateObject = {
            source: 'DashboardController',
            callback: handleIncomingAllocationUpdate,
            runSequential: true
        };
        $scope.allocationCountUpdateObject = {
            source: 'DashboardController',
            callback: handleIncomingAllocationCountUpdate
        };
        $scope.isSearchSectionOpen = false;

        var dashboardQuery = {};
        var receivedEmptyAllocationsResponse = false;
        /**
         * Flag to indicate of a request is in progress for new history
         * @type {boolean}
         */
        var isBusyRequestingData = false;
        $scope.filterIsApplied = false;

        getAvailableBeacons();
        initialSocketRegistration();

        $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
            SocketService.unregisterWatcher(SOCKET_TOPICS.ALLOCATION_ASSETS, 'DashboardController');
            SocketService.unregisterWatcher(SOCKET_TOPICS.ALLOCATION_COUNT, 'DashboardController');
            $mdDialog.cancel();
        });

        function getConcatLocation(item, column) {
            if (!item.location || (!item.location.area && !item.location.room)) {
                return '-';
            } else if (item.location.area && !item.location.room) {
                return item.location.area;
            } else if (!item.location.area && item.location.room) {
                return item.location.room;
            } else {
                return item.location.area + ', ' + item.location.room;
            }
        }

        function initialSocketRegistration() {
            if (SocketService.isConnected()) {
                if ($scope.type === 'asset') {
                    SocketService.registerWatcher(SOCKET_TOPICS.ALLOCATION_ASSETS, $scope.allocationUpdateObject);
                } else if ($scope.type === 'patient') {
                    SocketService.registerWatcher(SOCKET_TOPICS.ALLOCATION_PATIENTS, $scope.allocationUpdateObject);
                }
                SocketService.registerWatcher(SOCKET_TOPICS.ALLOCATION_COUNT, $scope.allocationCountUpdateObject);
            } else {
                setTimeout(initialSocketRegistration, 1000);
            }
        }

        function handleIncomingAllocationCountUpdate(count) {
            dashboard.availableCount = parseInt(count);
        }

        function handleIncomingAllocationUpdate(allocation) {
            allocation = allocation || {};
            console.log("Allocation update received");
            if (allocation.length != undefined || !allocation.allocationId) {
                return;
            }
            if($scope.type.toUpperCase()=="PATIENT"){

            }else{

            }
            $scope.noAssets = ($scope.allocations.length === 0);
        }

        function updateSocketSubscriptions(type) {
            var sub = type === 'asset' ? SOCKET_TOPICS.ALLOCATION_ASSETS : SOCKET_TOPICS.ALLOCATION_PATIENTS;
            var subToClose = type === 'asset' ? SOCKET_TOPICS.ALLOCATION_PATIENTS : SOCKET_TOPICS.ALLOCATION_ASSETS;
            SocketService.unregisterWatcher(subToClose, 'DashboardController');
            SocketService.registerWatcher(sub, $scope.allocationUpdateObject);
        }

        function discard(allocation) {
            BeaconAllocationService
                .getAllocation(allocation)
                .then(function (object) {
                    var discardDialog = $mdDialog.confirm()
                        .title('Would you like to discharge the selected allocation?')
                        .htmlContent('\<span class="modal-custom-body">You will no longer be able to track the ' + $scope.type + '</span>')
                        .ariaLabel('Discard allocation')
                        .ok('Yes')
                        .cancel('No');
                    $mdDialog.show(discardDialog).then(function () {
                        BeaconAllocationService.deallocate(object).then(function () {
                            NotificationService.show('Successfully discharged', 'success');
                            $scope.page = 1;
                            $scope.allocations = [];
                            updateAllocationList();
                            getAvailableBeacons();
                        });
                    }, function () {});
                }, function (error) {
                    NotificationService.show('Error! Please try again', 'error');
                });
        }

        function getAvailableBeacons() {
            BeaconService.available().then(function (result) {
                $scope.beacons = result;
                dashboard.availableCount = result.length;
                BeaconService.getCount().then(function (result) {
                    dashboard.usedCount = result;
                });
            })
        }

        function pushBeaconIntoOptions(beaconObj) {
            $scope.beacons.push(beaconObj);
        }

        function getAllocationMap() {
            BeaconAllocationService.getAllocationMap($scope.allocation).then(function (mapData) {
                $scope.mapOptions = {
                    mapImageUrl: mapData.mapUrl,
                    height: mapData.height || 400,
                    width: mapData.height || 400
                }
                $scope.mapFeatures = [JSON.parse(mapData.roomFeature)];

            })
        }
    }   
})();

'use strict';

//TODO: refactor this controller;

/**
 * @ngdoc controller
 * @name ilWebClient.controller:EntityFormController
 * @description
 * Entity controller used for handling entity create/update forms - contains general logic associated to these actions
 */
angular.module('ilWebClient').controller('AssetTypeEntityFormController', ['$scope','Restangular','$timeout',  function ($scope, Restangular, $timeout) {
    $scope.isLocationTypeAsset = isLocationTypeAsset;
    $scope.onSelectProcessingType = onSelectProcessingType;
    $scope.onSelectAccelerometer = onSelectAccelerometer;
    $scope.onDeleteStatus = onDeleteStatus;
    $scope.addNewAssetStatus = addNewAssetStatus;
    $scope.saveAssetType = saveAssetType;
    if($scope.model.id == null) $scope.model.useAccelerometer = true;
    function saveAssetType(){
        var event = $scope.model.id ? 'updated' : 'created';
        var assetStatuses = [];
        var tmpDefault = $scope.model.defaultStatus;
        if (event == 'created') {
            for (var i = 0; i < $scope.model.assetStatuses.length; i++) {
                if ($scope.model.assetStatuses[i].status == tmpDefault.status) {
                    $scope.model.assetStatuses[i].isDefault = true;
                    assetStatuses.push($scope.model.assetStatuses[i]);
                } else {
                    $scope.model.assetStatuses[i].isDefault = false;
                    assetStatuses.push($scope.model.assetStatuses[i]);
                }
            }
        } else if (event == 'updated') {
            for (var i = 0; i < $scope.model.assetStatuses.length; i++) {
                if ($scope.model.assetStatuses[i].status == tmpDefault.status) {
                    $scope.model.assetStatuses[i].isDefault = true;
                    assetStatuses.push($scope.model.assetStatuses[i]);
                } else {
                    $scope.model.assetStatuses[i].isDefault = false;
                    assetStatuses.push($scope.model.assetStatuses[i]);
                }
            }
        }
        $scope.model.assetStatuses = assetStatuses;
        $scope.model.assetType = $scope.model.assetTypes;
        $scope.save();
    }

    function addNewAssetStatus(status){
        return {id:null, status: status, implicit: false}
    }

    function isLocationTypeAsset(){
        return $scope.model.beaconProcessingType==='LOCATION';
    }

    function onSelectProcessingType(){
        if($scope.model.beaconProcessingType=='LOCATION'){
            loadStatusesForLocationAssetType();
        }else{
            $scope.model.assetStatuses=[];
        }
    }

    function loadStatusesForLocationAssetType(){
        Restangular.allUrl("statuses","api/dictionary/asset/type/locate/default").
        getList({assetTypeId: $scope.model.id, useAccelerometer: $scope.model.useAccelerometer}).then(function(statuses){
            $scope.model.assetStatuses = statuses;
            $scope.model.defaultStatus = null;
        });
    }

    function onSelectAccelerometer(){
        loadStatusesForLocationAssetType();
    }

    function onDeleteStatus(chip){
        if(chip.implicit){
            console.log("do not delete");
        }else{
            checkDefaultStatusStillPresent(chip);
        }
    }

    /**
     * @ngdoc method
     * @name checkDefaultStatusStillPresent
     * @methodOf ilWebClient.controller:EntityFormController
     * @description
     * Checks if default status exists on area
     *
     * @param {object}   chip   Chip to check default status on
     */
    function checkDefaultStatusStillPresent(chip) {
        console.log($scope.model.defaultStatus.status, chip,status);
        if ($scope.model.defaultStatus.status === (chip.status || chip)) {
            $scope.showDefaultStatus = false;
            $scope.searchTextStatus = null;
            $scope.model.defaultStatus = null;
            $timeout(function () {
                $scope.showDefaultStatus = true;
            }, 1);
        }
    }



}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:DictionaryController
 * @description
 * Main controller for system configuration section
 */
angular.module('ilWebClient').controller('DictionaryController', ['$scope', 'CrudFactory', 'UserService',
    function ($scope, CrudFactory, UserService) {
        $scope.ROLES = UserService.getRoles();
        $scope.PERMISSIONS = UserService.getHospitalPermissions();
        $scope.preActionHookAssetType = preActionHookAssetType;
        $scope.preActionHookSurgeryType = preActionHookSurgeryType;
        $scope.preActionHookMedSpec = preActionHookMedSpec;
        $scope.preActionHookPosition = preActionHookPosition;
        $scope.componentFilter = componentFilter;

        $scope.assetColumns = {
            'name': {
                'name': 'Asset Type'
            },
            'defaultStatus': {
                'name': 'Default Status',
                displayProperty: 'status'
            },
            'beaconProcessingType': {
                'name': 'Processing type'
            }
        };

        $scope.surgeryTypeColumns = {
            'name': {
                'name': 'Procedure Type'
            }
        };

        $scope.medSpecColumns = {
            'name': {
                'name': 'Medical Specialisation'
            }
        };

        $scope.positionColumns = {
            'name': {
                'name': 'Position'
            }
        };

        $scope.hospitalColumns = {
            'name': {
                'name': 'Hospital'
            },
            'componentsNames': {
                'name': 'Components'
            },
            'tenantId': {
                'name': 'URL'
            }
        };


        $scope.assetFormOptions = {
            showUpdateConfirmModal: true,
            assetStatuses: []
        };

        $scope.assetFilterConfig = null;

        $scope.$on('crud.updated.dictionary/asset/type', function () {
            updateDefaultStatuses();
            $scope.$broadcast('crud.filter.updateStatuses');
        });

        $scope.$on('crud.deleted.dictionary/asset/type', function () {
            updateDefaultStatuses();
            $scope.$broadcast('crud.filter.updateStatuses');
        });

        $scope.$on('crud.created.dictionary/asset/type', function () {
            updateDefaultStatuses();
            $scope.$broadcast('crud.filter.updateStatuses');
        });

        function updateDefaultStatuses() {
            var restService = new CrudFactory.CrudRest('dictionary/asset/type/status/default');
            restService.list().then(function (defStatusList) {
                var tmp = [];
                for (var i = 0; i < defStatusList.length; i++) {
                    tmp.push({
                        name: defStatusList[i],
                        value: defStatusList[i]
                    });
                }
                if ($scope.assetFilterConfig && $scope.assetFilterConfig.defaultStatus) {
                    $scope.assetFilterConfig.defaultStatus.values = tmp;
                }
            });
        }

        function preActionHookSurgeryType(surgeryType, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    resolve(surgeryType);
                    break;
                case 'create':
                    resolve(surgeryType);
                    break;
                default:
                    resolve(surgeryType);
            }
        }

        function preActionHookMedSpec(surgeryType, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    resolve(surgeryType);
                    break;
                case 'create':
                    resolve(surgeryType);
                    break;
                default:
                    resolve(surgeryType);
            }
        }

        function preActionHookPosition(surgeryType, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    resolve(surgeryType);
                    break;
                case 'create':
                    resolve(surgeryType);
                    break;
                default:
                    resolve(surgeryType);
            }
        }

        function preActionHookAssetType(assetType, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    resolve(assetType);
                    break;
                case 'create':
                    resolve(assetType);
                    break;
                default:
                    resolve(assetType);
            }
        }


        function componentFilter(filter) {
            if (filter.component) {
                filter.component.forEach(function(item){
                    filter[item] = true;
                });
            }
            return filter;
        }

    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:UploadController
 * @description
 * Main controller for uploading files to server
 */
angular.module('ilWebClient').controller('UploadController', ['$scope', 'NotificationService', 'Upload', 'API_URL', '$mdDialog', 'resource', 'MSG',
    function ($scope, NotificationService, Upload, API_URL, $mdDialog, resource, MSG) {

        $scope.backToFileSelection = backToFileSelection;
        $scope.close = close;
        $scope.submit = submit;
        $scope.uploadInProgress = false;
        $scope.finishedUpload = false;
        $scope.progressPercentage = 0;
        $scope.stats = {
            correctEntries: '',
            incorrectEntries: '',
            errors: []
        };

        function submit() {
            if ($scope.form.file.$valid && $scope.file) {
                upload($scope.file);
            }
        }

        function close(requiresRefresh) {
            if (requiresRefresh) {
                $mdDialog.hide({needsRefresh: true});
            } else {
                $mdDialog.cancel();
            }
        }

        function upload(file) {
            $scope.uploadInProgress = true;
            $scope.finishedUpload = false;
            Upload.upload({
                url: API_URL + '/' + resource + '/upload',
                data: {file: file}
            }).then(
                handleUploadSuccess,
                handleUploadError,
                handleUploadProgress
            );
        }

        function handleUploadSuccess(result) {
            $scope.stats.correctEntries = result.data.importedEntity;
            $scope.stats.incorrectEntries = result.data.unimportedEntity;
            $scope.uploadInProgress = false;
            $scope.finishedUpload = true;
        }

        function handleUploadError(error) {
            if (error.status === 400) {
                $scope.stats.errors = error.data.errors;
                $scope.stats.correctEntries = error.data.importedEntity;
                $scope.stats.incorrectEntries = error.data.unimportedEntity;
            } else {
                $scope.stats.errors = [ MSG.DEFAULT_FILE_UPLOAD_ERR ];
            }
            $scope.uploadInProgress = false;
            $scope.finishedUpload = true;
        }

        function handleUploadProgress(progress) {
            $scope.progressPercentage = parseInt(100.0 * progress.loaded / progress.total);
        }

        function backToFileSelection() {
            $scope.uploadInProgress = false;
            $scope.finishedUpload = false;
            $scope.file = null;
            $scope.stats = {
                correctEntries: '',
                incorrectEntries: '',
                errors: []
            };
        }

    }
]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:FloorEditController
 * @description
 * Handles create/edit for floors
 */
angular.module('ilWebClient').controller('FloorEditController', ['$scope', '$state', '$stateParams', 'CrudFactory', 'UserService', 'UtilService', 'NotificationService', 'WizardHandler', 'FloorService', 'FEATURE_TYPES', 'Upload',

    function ($scope, $state, $stateParams, CrudFactory, UserService, UtilService, NotificationService, WizardHandler, FloorService, FEATURE_TYPES, Upload) {
        // Variables
        $scope.formOptions = {
            units: [],
            rooms: [],
            usedRooms: []
        };;
        $scope.savingEntity = false;
        $scope.media = {
            files: []
        };
        $scope.mapImageChanged = false;
        $scope.editStep = 1;
        $scope.currentWizardStep = '';
        $scope.FEATURE_TYPES = FEATURE_TYPES

        // Scale map variables and functions
        $scope.scale = {};
        $scope.distanceOnMap = 0;
        $scope.knownScale = true;
        $scope.scaleMapShapes = {
            circle: false,
            marker: false,
            polygon: false,
            rectangle: false
        };

        $scope.displayScaleMap = displayScaleMap;
        $scope.hideScaleMap = hideScaleMap;
        $scope.handleMapDrawCreated = handleMapDrawCreated;
        $scope.handleScaleLineDeleted = handleScaleLineDeleted;

        // Room map variables and functions
        $scope.drawingToBind = null;
        $scope.featureType = FEATURE_TYPES.ROOM;
        $scope.saveFloorFeature = saveFloorFeature;
        $scope.updateMapFeatures = updateMapFeatures;
        $scope.deleteFloorFeatures = deleteFloorFeatures;
        $scope.roomMapShapes = {
            circle: false
        }

        $scope.handleMapScaleCreated = handleMapScaleCreated;
        $scope.selectDrawingToBind = selectDrawingToBind;


        // Functions
        $scope.saveFloor = saveFloor;
        $scope.saveMap = saveMap;
        $scope.backFromMap = backFromMap;
        $scope.close = close;
        $scope.computeDecimalMapScale = computeDecimalMapScale;

        //INIT
        if($stateParams.floor){
            getFloorById($stateParams.floor);
        }else{
            createNewFloor();
        }

        function close(){
            console.log("CLOSING....");
            $state.go('main.floor');
        }

        function loadFloor(){
            updateAvailableRooms();
            updateMapScaleUnits();
            updateFeatureTypes();
            computeScaleFraction();
            $scope.scaleOptions = $scope.model.mapMetadata;
            $scope.isEditMode = true;
        }

        function createNewFloor(){
            updateAvailableRooms()
            updateMapScaleUnits();
            updateFeatureTypes();
            $scope.model = {};
            $scope.isEditMode = false;
        }

        function getFloorById(floor) {
            FloorService.getFloor(floor).then(function(_floor){
                $scope.model = _floor;
                $scope.model.mapMetadata = $scope.model.mapMetadata || {};
                loadFloor();
            }, function(error){
                reject(error.data.webErrors.Floor[0]);
            });
        }

        function updateAvailableRooms() {
            FloorService.getAvailableRooms().then(function (availableRooms) {
                $scope.formOptions.rooms = availableRooms;
            })
        }

        function updateUsedRooms(floor) {
            FloorService.getUsedRooms(floor).then(function (usedRooms) {
                $scope.formOptions.usedRooms = usedRooms;

            })
        }

        function updateMapScaleUnits() {
            var restService = new CrudFactory.CrudRest('map/unit');
            restService.list().then(function (units) {
                $scope.formOptions.units = units;
            })
        };

        function updateFeatureTypes() {
            var restService = new CrudFactory.CrudRest('map/feature/type/');
            restService.list().then(function (featureTypes) {
                $scope.formOptions.featureTypes = featureTypes
            })
        };

        function displayScaleMap() {
            $scope.knownScale = false;
            initScaleMap();
        }

        function initScaleMap() {
            if ($scope.media.files[0]) {
                Upload.base64DataUrl($scope.media.files[0]).then(function (url) {
                    Upload.imageDimensions($scope.media.files[0]).then(function (dimensions) {
                        $scope.scaleOptions = {
                            mapImageUrl: url,
                            height: dimensions.height,
                            width: dimensions.width
                        };
                        $scope.showScaleMap = true;
                    })

                })
            } else {
                $scope.scaleOptions = $scope.model.mapMetadata;
                $scope.showScaleMap = true;
            }

        }

        function hideScaleMap() {
            $scope.showScaleMap = false;
            $scope.knownScale = true;
        }

        function initRoomMap(mapMetadata, floorFeatures) {
            $scope.showRoomMap = true;
            hideScaleMap();
            $scope.roomMapOptions = mapMetadata ? mapMetadata : $scope.model.mapMetadata;
            $scope.floorFeatures = (floorFeatures && floorFeatures.length) ?
                floorFeatures.map(function (feature) {
                    return JSON.parse(feature)
                }) : []

        }

        // Compute scale fraction from decimal for populating scale inputs
        function computeScaleFraction() {
            if ($scope.model.mapMetadata && $scope.model.mapMetadata.scale) {
                var decimalArray = ($scope.model.mapMetadata.scale.toString()).split(".");
                if (decimalArray) {
                    $scope.scale.one = decimalArray[0] ? parseInt(decimalArray[0]) + parseInt((decimalArray[1] || 0)) : 0;
                    $scope.scale.to = decimalArray[1] ? Math.pow(10, decimalArray[1].length) : 1;
                }

            }
        }

        function handleMapDrawCreated(drawnItems) {
            return function (mapEv) {
                var layer = mapEv.layer;
                layer.on('click', function (layerEv) {
                    $scope.selectDrawingToBind(layerEv.target);
                });
                drawnItems.addLayer(layer);
            }
        };

        function handleMapScaleCreated(drawnItems) {
            return function (mapEv) {
                var layer = mapEv.layer;
                if (mapEv.layerType === "polyline") {
                    var start = layer._latlngs[0].lat - layer._latlngs[1].lat
                    var end = layer._latlngs[0].lng - layer._latlngs[1].lng
                    $scope.distanceOnMap = Math.sqrt(start * start + end * end);

                }
                drawnItems.addLayer(layer);
            }
        }

        function deleteFloorFeatures(layerGroup) {
            var featuresToRemove = [];
            $scope.savingEntity = true;
            var layers = layerGroup.layers._layers
            var layerKeys = Object.keys(layers);
            layerKeys.forEach(function (layerKey) {
                if (layers[layerKey].feature && layers[layerKey].feature.id) {
                    featuresToRemove.push(layers[layerKey].toGeoJSON());
                };
            });
            if (featuresToRemove.length) {
                FloorService.deleteFloorFeatures($scope.model, featuresToRemove).then(function (response) {
                    $scope.$broadcast('feature.deleted', featuresToRemove)
                    updateAvailableRoomList()
                    updateUsedRoomList();
                    $scope.savingEntity = false;
                    $scope.drawingToBind = null;
                }, function (failResponse) {
                    if (!failResponse.data.webErrors) {
                        NotificationService.show('Error! Please try again', 'error');
                    }
                    $scope.savingEntity = false;
                    $scope.validationErrors = failResponse.data.webErrors;
                })
            }
        }

        function handleScaleLineDeleted(layerGroup) {
            for (var property in layerGroup.layers._layers) {
                if (layerGroup.layers._layers.hasOwnProperty(property)) {
                    $scope.distanceOnMap = null;
                }
            }
        }

        function selectDrawingToBind(layer) {
            $scope.drawingToBind = layer;
            $scope.$apply();
        }


        function setFeatureStyle(feature) {
            $scope.drawingToBind.bindPopup(feature.properties.typeName);
            $scope.drawingToBind.openPopup();
            $scope.drawingToBind.setStyle ? $scope.drawingToBind.setStyle({
                color: feature.properties.typeColor
            }) : angular.noop();
        }

        function updateMapFeatures(layerGroup, roomChanged) {
            var updatedFeatures = [];
            $scope.savingEntity = true;
            if (roomChanged) {
                setFeatureStyle(layerGroup)
                updatedFeatures.push(layerGroup);
            } else {
                updatedFeatures = Object.keys(layerGroup.layers._layers).map(function (layerKey) {
                    return layerGroup.layers._layers[layerKey].toGeoJSON()
                });
            }
            FloorService.updateFloorFeatures($scope.model, updatedFeatures).then(function (response) {
                $scope.savingEntity = false;
                $scope.drawingToBind = null;
                $scope.$broadcast('feature.edited', updatedFeatures)
                updateAvailableRoomList()
                updateUsedRoomList();
            })

        }



        function createFloorFeature(geoJson) {
            $scope.savingEntity = true;
            FloorService.createFloorFeature($scope.model, geoJson).then(function (response) {
                if (response) {
                    var createdFeature = JSON.parse(response)
                    $scope.savingEntity = false;
                    $scope.$broadcast('feature.created', createdFeature)
                    setFeatureStyle(createdFeature)
                    $scope.drawingToBind = null;

                    //Update rooms
                    updateAvailableRoomList()
                    updateUsedRoomList();

                }

            }, function (failResponse) {
                if (!failResponse.data.webErrors) {
                    NotificationService.show('Error! Please try again', 'error');
                }
                $scope.validationErrors = failResponse.data.webErrors;

            })
        }

        function saveFloorFeature(room) {
            var geoJson;
            if ($scope.drawingToBind) {
                geoJson = $scope.drawingToBind.toGeoJSON();
                geoJson.properties = {
                    layerId: $scope.drawingToBind._leaflet_id,
                    type: $scope.featureType,
                    typeName: room.name,
                    typeColor: room.color || '#3388ff',
                    typeId: room.id,
                    floorId: $scope.model.id
                };
                $scope.drawingToBind.feature && $scope.drawingToBind.feature.id ?
                    updateMapFeatures(geoJson, true) :
                    createFloorFeature(geoJson)
            } else {
                NotificationService.show('First click on an area you drew, then click on a room to associate it with', 'error');
            }
        }

        function nextStep(step) {
            if( $scope.model.mapMetadata.mapImageUrl && $scope.form.$valid){
                $scope.editStep = step;
            }
        }

        function backFromMap() {
            $scope.showRoomMap = false;
        }

        function computeDecimalMapScale() {
            if ($scope.scale.one && $scope.scale.to) {
                $scope.model.mapMetadata.scale = parseFloat(($scope.scale.one / $scope.scale.to).toFixed(5));
            } else if ($scope.distanceOnMap && $scope.scale.to) {
                $scope.model.mapMetadata.scale = parseFloat(($scope.distanceOnMap / $scope.scale.to).toFixed(5));
            }
        }

        function saveFloor(close){
            saveFloorMap();
            if(close){
                $scope.close();
            }else{
                nextStep(2);
            }
        }

        function saveMap(close){
            saveFloorMap();
            if(close){
                $scope.close()
            }else{
                nextStep(1);
            }
        }

        function saveFloorMap() {
            var floorRestService = new CrudFactory.CrudRest('floor');
            var callback = $scope.model.id ? floorRestService.updateWithFile.bind(floorRestService) : floorRestService.createWithFile.bind(floorRestService);
            $scope.savingEntity = true;
            var mapImage = $scope.mapImageChanged ? $scope.media.files[0] : null;
            callback($scope.model, mapImage)
                .then(function (successResponse) {
                        if (successResponse && successResponse.data) {
                            $scope.mapImageChanged = false;
                            $scope.savingEntity = false;
                            $scope.model = successResponse.data;
                            initRoomMap($scope.model.mapMetadata, $scope.model.floorFeatures);

                            //Update rooms
                            updateAvailableRoomList()
                            updateUsedRoomList();
                            $scope.$emit('crud.reload.floor');
                        }
                    },
                    function (failResponse) {
                        if (!failResponse.data.webErrors) {
                            NotificationService.show('Error! Please try again', 'error');
                        }
                        $scope.savingEntity = false;
                        $scope.validationErrors = failResponse.data.webErrors;

                    })
        };

        function updateAvailableRoomList() {
            FloorService.getAvailableRooms().then(function (availableRooms) {
                $scope.formOptions.rooms = availableRooms;
            })
        };

        function updateUsedRoomList() {
            FloorService.getUsedRooms($scope.model).then(function (usedRooms) {
                $scope.formOptions.usedRooms = usedRooms;
            })
        };

        $scope.$watch('media.files', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.mapImageChanged = true;
                if (!$scope.knownScale) {
                    $scope.showScaleMap = false;
                    initScaleMap();
                }
            }
        });

        $scope.$watch('currentWizardStep', function (newValue, oldValue) {
            if (newValue === 'Add rooms') {
                initRoomMap($scope.model.mapMetadata, $scope.model.floorFeatures);
            }
        })
    }
]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:FloorController
 * @description
 * Handles CRUD for floors
 */
angular.module('ilWebClient').controller('FloorController', ['$scope', 'CrudFactory', 'UserService', '$mdDialog', 'UtilService', 'NotificationService', 'FloorService',
    function ($scope, CrudFactory, UserService, $mdDialog, UtilService, NotificationService, FloorService) {

        $scope.ROLES = UserService.getRoles();
        $scope.preActionHook = preActionHook;

        $scope.columns = {
            'name': {
                'name': 'Name',
                'orderBy': 'name'
            },
            'description': {
                'name': 'description'
            }
        };

        $scope.actions = [];
        $scope.editRoute = "main.editFloor";

        function disableButton(room) {
            return !$scope.ROLES.SAD;
        }

        $scope.filterConfig = null;
        $scope.options = {
            query: {
                order: '',
                limit: 15,
                page: 1
            }
        };


        $scope.$on('crud.updated.floor', function () {

        });

        $scope.$on('crud.created.floor', function () {

        });

        $scope.$on('crud.deleted.floor', function () {

        });

        $scope.$on('crud.intermediaryDialog.close', function (event, data) {

        });

        $scope.$on('crud.dialog.open.floor', function (event, data) {

        });

        $scope.$on('crud.dialog.close.floor', function (event, data) {

        });

        function preActionHook(floor, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    resolve(floor)
                    break;
                default:
                    resolve(floor);
            }
        }

    }
]);

/**
 * Created by florindobre on 15/11/2016.
 */
'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:FloorService
 *
 * @description
 * Helper service for handling gateway-related actions
 *
 */
angular.module('ilWebClient').service('FloorService', ['Restangular', function (Restangular) {
    this.service = Restangular.service('floor/');
    var self = this;

    /**
     * @ngdoc method
     * @name updateFloorRooms
     * @methodOf ilWebClient.service:FloorService
     * @description
     * Updates a floor rooms with the features drawn by the user
     *
     * @param {object}  floor   Floor object
     * @param {object}  rooms   Rooms array
     *
     * @returns {object}  Promise that resolves into data from server
     */
    function updateFloorFeatures(floor, rooms) {
        return self.service.one().customPUT(rooms, floor.id + '/map/feature');
    }

    /**
     * @ngdoc method
     * @name createFloorFeature
     * @methodOf ilWebClient.service:FloorService
     * @description
     * Creates a new floor room with the feature drawn by the user
     *
     * @param {object}  floor   Floor object
     * @param {object}  floor   Room object
     *
     * @returns {object}  Promise that resolves into data from server
     */
    function createFloorFeature(floor, room) {
        return self.service.one().customPOST(room, floor.id + '/map/feature');
    }

    function getFloor(floor){
        return self.service.one(floor).get();
    }

    /**
     * @ngdoc method
     * @name createFloorFeature
     * @methodOf ilWebClient.service:FloorService
     * @description
     * Deletes a floor rooms
     *
     * @param {object}  floor   Floor object
     * @param {object}  floor   Rooms array
     *
     * @returns {object}  Promise that resolves into data from server
     */

    function deleteFloorFeatures(floor, rooms) {
        return self.service.one().customPUT(rooms, floor.id + '/map/feature/remove');
    }
    /**
     * @ngdoc method
     * @name getAvailableRooms
     * @methodOf ilWebClient.service:FloorService
     * @description
     * Gets all system wide available rooms
     *
     *
     * @returns {object}  Promise that resolves into data from server
     */

    function getAvailableRooms() {
        return self.service.one().customGET('room/available/');
    }
    /**
     * @ngdoc method
     * @name getUsedRooms
     * @methodOf ilWebClient.service:FloorService
     * @description
     * Gets all rooms assigned to a feature for a floor
     * @param {object}  floor   Floor object
     *
     * @returns {object}  Promise that resolves into data from server
     */

    function getUsedRooms(floor) {
        return self.service.one().customGET(floor.id + '/room/assigned/');
    }
    return {
        createFloorFeature: createFloorFeature,
        updateFloorFeatures: updateFloorFeatures,
        deleteFloorFeatures: deleteFloorFeatures,
        getAvailableRooms: getAvailableRooms,
        getUsedRooms: getUsedRooms,
        getFloor: getFloor
    };

}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:FlowController
 * @description
 * Handles the creation/editing of flows for patients
 */
angular.module('ilWebClient').controller('FlowController', ['$scope', 'UserService', '$mdDialog', 'FlowService', 'CrudFactory', 'Restangular', 'NotificationService', 'HospitalThemeService', 'MSG', function ($scope, UserService, $mdDialog, FlowService, CrudFactory, Restangular, NotificationService, HospitalThemeService, MSG) {

    $scope.model = {};
    $scope.roomsList = [];
    $scope.submitFlow = submitFlow;
    $scope.resetChanges = resetChanges;
    $scope.addRoomToFlow = addRoomToFlow;
    $scope.removeRoomFromFlow = removeRoomFromFlow;
    $scope.getHospitalFlow = getHospitalFlow;
    $scope.draggableItems = [];
    $scope.maxIndex = 0;
    $scope.isServerRequestActive = false;
    $scope.ROLES = UserService.getRoles();
    $scope.PERMISSIONS = UserService.getHospitalPermissions();
    $scope.theme = null;
    $scope.disclaimer = MSG.FORM_UPDATE_DISCLAIMER;

    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        $mdDialog.cancel();
    });

    HospitalThemeService
        .loadTheme()
        .then(function (theme) {
            $scope.theme = theme;
        })
        .catch(function (err) {

        });

    function addRoomToFlow(room, index) {
        if($scope.draggableItems.length === 0 || ($scope.draggableItems.length > 0 && $scope.draggableItems[$scope.draggableItems.length - 1].id != room.id)){
            doAddRoom(room);
        }else{
            NotificationService.show("You can't have two consecutive rooms with the same name!" , 'error');
        }
    }

    function doAddRoom(room){
        var toAdd = angular.copy(room);
        $scope.maxIndex +=1;
        toAdd.path_index = $scope.maxIndex;
        $scope.draggableItems.push(toAdd);
    }

    function removeRoomFromFlow(room, index) {
        $scope.draggableItems.splice(index, 1);
    }

    function resetChanges() {
        getHospitalFlow(true);
    }

    function buildFlowModel(pathName, hospital) {
        return assembleRoomHierarchy(pathName, hospital, $scope.draggableItems);
    }

    function updateParentRoomList() {
        var restService = new CrudFactory.CrudRest('room');
        // filter to get all rooms that are either parent or standalone rooms
        var filter = {
            hasNoParentAndNoChildOrHasChildAndNoParent: true
        };
        restService.list(filter).then(function (rooms) {
            $scope.roomsList = rooms.plain();
        });
    }

    function submitFlow() {
        $scope.validationErrors = null;
        var flowModel = buildFlowModel($scope.model.pathName, $scope.model.hospital);
        FlowService
            .saveFlow(flowModel)
            .then(function (successResponse) {
                $scope.model = successResponse || {};
                $scope.draggableItems = disassembleRoomHierarchy($scope.model);
                console.log($scope.draggableItems);
                updateParentRoomList();
                $mdDialog.hide($scope.model);
                if ($scope.model.id) {
                    NotificationService.show('Patient flow updated', 'success');
                } else {
                    NotificationService.show('Patient flow created', 'success');
                }
            }, function (failResponse) {
                if (!failResponse.data.webErrors) {
                    NotificationService.show('Error! Please try again', 'error');
                }
                $scope.validationErrors = failResponse.data.webErrors;
            });
    }

    function assembleRoomHierarchy(pathName, hospital, roomsArray) {
        var roomsArrayCopy = roomsArray.map(function(room, index) {
            var isOptional = room.optionalPath;
            delete room.optionalPath;
            return {
                pathName: pathName,
                hospital: hospital,
                room: room,
                path_index: index,
                optionalPath: isOptional,
                root: index === 0
            };
        });

        for (var i = roomsArrayCopy.length - 1; i >= 0; i--) {
            roomsArrayCopy[i].nextPath = roomsArrayCopy[i + 1];
        }

        return roomsArrayCopy[0];
    }

    function disassembleRoomHierarchy(roomsHierarchyObject) {
        if ($scope.model.id && $scope.model.pathName) {
            var roomsHierarchyObjectCopy = angular.copy(roomsHierarchyObject);
            var disassembledArray = [];
            if (!roomsHierarchyObject) {
                return [];
            } else {
                roomsHierarchyObjectCopy.room.path_index = roomsHierarchyObjectCopy.path_index;
                roomsHierarchyObjectCopy.room.optionalPath = roomsHierarchyObjectCopy.optionalPath;
                disassembledArray.push(roomsHierarchyObjectCopy.room);
                while (roomsHierarchyObjectCopy.nextPath) {
                    roomsHierarchyObjectCopy = roomsHierarchyObjectCopy.nextPath;
                    roomsHierarchyObjectCopy.room.optionalPath = roomsHierarchyObjectCopy.optionalPath;
                    roomsHierarchyObjectCopy.room.path_index = roomsHierarchyObjectCopy.path_index;
                    disassembledArray.push(roomsHierarchyObjectCopy.room);
                }
                return disassembledArray;
            }
        } else {
            return [];
        }
    }

    function getHospitalFlow(isResetting) {
        $scope.isServerRequestActive = true;
        FlowService
            .getSingleFlow()
            .then(function (result) {
                $scope.model = result || {};
                $scope.draggableItems = disassembleRoomHierarchy($scope.model);
                console.log($scope.draggableItems);
                $scope.maxIndex = $scope.draggableItems.length - 1;
                updateParentRoomList();
                $scope.isServerRequestActive = false;
                if (isResetting) {
                    NotificationService.show('Changes reverted', 'success');
                }
            })
            .catch(function (error) {
                $scope.isServerRequestActive = false;
                NotificationService.show('Error! Please try again', 'error');
            })
    }

    getHospitalFlow(false);

}]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:FlowService
 *
 * @description
 * Helper service for handling flow-related actions
 *
 */
angular.module('ilWebClient').service('FlowService', ['Restangular', function (Restangular) {
    var self = this;
    self.service = Restangular.service('patient/path');

    var flowServiceAPI = {
        getSingleFlow: getSingleFlow,
        saveFlow: saveFlow,
        deleteFlow: deleteFlow
    };

    /**
     * @ngdoc method
     * @name getSingleFlow
     * @methodOf ilWebClient.service:FlowService
     * @description
     * Get a single flow object from the server
     *
     * @param {number}  hospitalId      Hospital ID for which to get flow
     *
     * @returns {object}                Promise that resolves into data from server
     */
    function getSingleFlow(hospitalId) {
        return Restangular.one('patient/path/').customGET('', {hospitalId: hospitalId})
    }

    /**
     * @ngdoc method
     * @name getSingleFlow
     * @methodOf ilWebClient.service:FlowService
     * @description
     * Get a single flow object from the server
     *
     * @param {object}  flow    Flow object to update
     *
     * @returns {object}        Promise that resolves into data from server
     */
    function saveFlow(flow) {
        return Restangular.one('patient/path/').customPOST(flow);
    }

    /**
     * @ngdoc method
     * @name deleteFlow
     * @methodOf ilWebClient.service:FlowService
     * @description
     * Delete a flow object from the server
     *
     * @param {object}  flow    Flow object to delete
     *
     * @returns {object}        Promise that resolves into data from server
     */
    function deleteFlow(flow) {
        return Restangular.one('patient/path').customDELETE(flow.id);
    }

    return flowServiceAPI;
}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:GatewayController
 * @description
 * Handles CRUD on gateways
 */
angular.module('ilWebClient').controller('GatewayController', ['$scope', 'GatewayService', 'CrudFactory', 'BeaconService', 'NotificationService', 'SocketService', '$mdDialog', 'UserService', 'SOCKET_TOPICS', 'Restangular', 'GATEWAY_STATUSES','GATEWAY_BT_STATUSES',
    function ($scope, GatewayService, CrudFactory, BeaconService, NotificationService, SocketService, $mdDialog, UserService, SOCKET_TOPICS, Restangular, GATEWAY_STATUSES, GATEWAY_BT_STATUSES) {

        $scope.customItemStyle = customItemStyle;
        $scope.preActionHook = preActionHook;
        $scope.cannotDeleteItem = cannotDeleteItem;
        $scope.ROLES = UserService.getRoles();
        $scope.gatewayUpdateObject = {
            source: 'GatewayControllerUpdate',
            callback: handleIncomingGatewayUpdate
        };
        $scope.gatewayDeleteObject = {
            source: 'GatewayControllerDelete',
            callback: handleIncomingGatewayDelete
        };

        var isGatewayModalOpen = false;

        function handleIncomingGatewayUpdate(gateway) {
            if (!gateway || !gateway.id || gateway.removed) {
                return;
            }
            var statusMatch = !$scope.activeSelectionFilters.status ||
                $scope.activeSelectionFilters.status.indexOf(gateway.status)>=0;
            var btStatusMatch = !$scope.activeSelectionFilters.btStatus ||
                $scope.activeSelectionFilters.btStatus.indexOf(gateway.btStatus)>=0;
            var controlBeaconMatch = !$scope.activeSelectionFilters.controlBeacon ||
                (
                    gateway.controlBeacon &&
                    $scope.activeSelectionFilters.controlBeacon.indexOf(gateway.controlBeacon.id.toString())>=0
                );
            var searchMatch = !$scope.activeSearchFilters.name ||
                                gateway.name.toUpperCase().indexOf($scope.activeSearchFilters.name.toUpperCase()) !== -1 ||
                                gateway.uuid.toUpperCase().indexOf($scope.activeSearchFilters.name.toUpperCase()) !== -1;

            if(statusMatch && btStatusMatch && controlBeaconMatch && searchMatch){
                $scope.$broadcast('gateway.update', Restangular.restangularizeElement(null, gateway, 'gateway'));
            }else{
                $scope.$broadcast('gateway.remove', Restangular.restangularizeElement(null, gateway, 'gateway'));
            }

            setTimeout(function () {
                $scope.$apply();
            }, 500);
        }

        function handleIncomingGatewayDelete(gateway) {
            if (!gateway || !gateway.id || !gateway.removed) {
                return;
            }
            $scope.$broadcast('crud.deleted.gateway', Restangular.restangularizeElement(null, gateway, 'gateway'));

            setTimeout(function () {
                $scope.$apply();
            }, 500);
        }

        $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
            SocketService.unregisterWatcher(SOCKET_TOPICS.GATEWAY, 'GatewayControllerUpdate');
            SocketService.unregisterWatcher(SOCKET_TOPICS.GATEWAY, 'GatewayControllerDelete');
        });

        initialSocketRegistration();

        function initialSocketRegistration() {
            if (SocketService.isConnected()) {
                SocketService.registerWatcher(SOCKET_TOPICS.GATEWAY, $scope.gatewayUpdateObject);
                SocketService.registerWatcher(SOCKET_TOPICS.GATEWAY, $scope.gatewayDeleteObject);
            } else {
                setTimeout(initialSocketRegistration, 1000);
            }
        }

        $scope.columns = {
            'name': {
                'name': 'Name',
                'orderBy': 'name'
            },
            'uuid': {
                'name': 'MAC Address'
            },
            'controlBeacon': {
                'name': 'Beacon',
                'displayProperty': 'name'
            },
            'status': {
                'name': 'status'
            },
            'btStatus':{
                'name': 'bt status',
                'getTooltip': function(item, column){
                    return item.btMac;
                }
            },
            'clientVersion':{
                'name': 'Version'
            }
        };

        $scope.actions = [{
                title: 'Start Bluetooth',
                action: 'start',
                icon: {
                    'zmdi-bluetooth': true
                },
                color: 'green',
                callback: startGateway,
                shouldBeHidden: disableStartGateway
            },
            {
                title: 'Stop Bluetooth',
                action: 'stop',
                icon: {
                    'zmdi-bluetooth-off': true
                },
                color: 'red',
                callback: stopGateway,
                shouldBeHidden: disableStopGateway
            },
            {
                title: 'Restart Gateway',
                action: 'restart',
                icon: {
                    'zmdi-replay': true
                },
                color: 'purple',
                callback: restartGateway,
                shouldBeDisabled: disableRestartGateway
            }
        ];

        function disableStartGateway(gateway) {
            return [GATEWAY_BT_STATUSES.UNKNOWN, GATEWAY_BT_STATUSES.HW_FAIL, GATEWAY_BT_STATUSES.PENDING, GATEWAY_BT_STATUSES.UP].indexOf(gateway.btStatus) != -1;
        }

        function disableStopGateway(gateway) {
            return [GATEWAY_BT_STATUSES.UNKNOWN,GATEWAY_BT_STATUSES.HW_FAIL, GATEWAY_BT_STATUSES.PENDING, GATEWAY_BT_STATUSES.DOWN].indexOf(gateway.btStatus) != -1;
        }

        function disableRestartGateway(gateway) {
            return [GATEWAY_STATUSES.RUNNING, GATEWAY_STATUSES.NO_SIGNAL].indexOf(gateway.status) == -1;
        }

        $scope.filterConfig = {
            'status': {
                type: 'select',
                column: 'status',
                placeholder: 'by Status',
                allowMultipleSelection: true,
                values: []
            },
            'bt_status':{
                type: 'select',
                column: 'btStatus',
                placeholder: 'by BT Status',
                allowMultipleSelection:true,
                values:[]
            },
            'uuid': {
                type: 'select',
                column: 'controlBeacon',
                placeholder: 'by Beacon ID',
                allowMultipleSelection: true,
                values: []
            }
        };

        $scope.formOptions = {
            rooms: [],
            beacons: []
        };

        function startGateway(gateway) {
            return callGatewayAction('start', gateway)
        }

        function stopGateway(gateway) {
            return callGatewayAction('stop', gateway)
        }

        function restartGateway(gateway) {
            return callGatewayAction('restart', gateway)
        }

        function callGatewayAction(action, gateway) {
            return GatewayService[action](gateway).then(function (updated) {
                switch (action) {
                    case 'start':
                        NotificationService.show('Bluetooth started', 'success');
                        break;
                    case 'stop':
                        NotificationService.show('Bluetooth stopped', 'success');
                        break;
                    case 'restart':
                        NotificationService.show('Gateway restarted', 'success');
                        break;
                }
                $scope.$broadcast('crud.updated.gateway', updated)
            }, function (error) {
                NotificationService.show('Error! Please try again', 'error');
            })
        }

        $scope.$on('crud.intermediaryDialog.close', function (event, data) {
            updateRoomList(data);
            updateBeaconsList(data);
        });

        function updateRoomList(data) {
            var restService = new CrudFactory.CrudRest('room');
            var hospitalId = (data && data.hospital) ? data.hospital.id : undefined;
            restService.list({
                hospital: hospitalId
            }).then(function (roomList) {
                $scope.formOptions.rooms = roomList;
            }, function (error) {});
        }

        $scope.$on('crud.created.gateway', function () {
            if (!isGatewayModalOpen) {
                updateBeaconsList();
            }
        });

        function updateBeaconsList(data) {
            var restService = new CrudFactory.CrudRest('beacon');
            var hospitalId = (data && data.hospital) ? data.hospital.id : undefined;
            restService.list({
                type: 'asset',
                status: 'AVAILABLE',
                hospital: hospitalId
            }).then(function (beaconList) {
                $scope.formOptions.beacons = beaconList;
            });
        }

        $scope.$on('crud.dialog.open.gateway', function (event, model) {
            if (model.controlBeacon) {
                $scope.formOptions.beacons.push(model.controlBeacon);
            }
            isGatewayModalOpen = true;
        });
        $scope.$on('crud.dialog.close.gateway', function (event, model) {
            if (model.controlBeacon) {
                for (var i = 0; i < $scope.formOptions.beacons.length; i++) {
                    if ($scope.formOptions.beacons[i].id == model.controlBeacon.id) {
                        $scope.formOptions.beacons.splice(i, 1);
                        break;
                    }
                }
            }
            isGatewayModalOpen = false;
        });

        function getControlBeacons() {
            var restService = new CrudFactory.CrudRest('beacon/control-beacon/');
            restService.list().then(function (beaconList) {
                $scope.formOptions.controlBeacons = beaconList;
                var tmp = [];
                for (var i = 0; i < beaconList.length; i++) {
                    tmp.push({
                        name: beaconList[i].name,
                        value: beaconList[i].id
                    });
                }
                $scope.filterConfig.uuid.values = tmp;
            });
        }

        function updateGatewayStatuses() {
            var restService = new CrudFactory.CrudRest('gateway/status');
            restService.list().then(function (statusList) {
                statusList.forEach(function (item) {
                    $scope.filterConfig.status.values.push({
                        name: item,
                        value: item
                    });
                });
            });
        }

        function updateGatewayBTStatuses() {
            var restService = new CrudFactory.CrudRest('gateway/bt_status');
            restService.list().then(function (statusList) {
                statusList.forEach(function (item) {
                    $scope.filterConfig.bt_status.values.push({
                        name: item,
                        value: item
                    });
                });
            });
        }

        function customItemStyle(item, column, config) {
            var style = {};
            switch(column) {
                case "status":
                    if (item.status && [GATEWAY_STATUSES.NO_SIGNAL, GATEWAY_STATUSES.UNAVAILABLE].indexOf(item.status) != -1) {
                        style.color = 'red';
                    } else if (item.status && [GATEWAY_STATUSES.RUNNING].indexOf(item.status) != -1) {
                        style.color = 'green';
                    }
                    break;
                case "clientVersion":
                    if(item.clientVersion == item.clientLastVersion){
                        style.color = 'green';
                    }else{
                        style.color =  'red';
                    }
                    break;
                case "btStatus":
                    if(item.btStatus && [GATEWAY_BT_STATUSES.UP].indexOf(item.btStatus) != -1){
                        style.color = 'green';
                    }else if(item.btStatus && [GATEWAY_BT_STATUSES.DOWN].indexOf(item.btStatus) != -1){
                        style.color = 'red';
                    }else{
                        style.color = 'black';
                    }
            }
            return style;
        }

        function preActionHook(gateway, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    handleGatewayDeletion(gateway, resolve, reject);
                    break;
                case 'create':
                    updateRoomList(gateway);
                    updateBeaconsList(gateway);
                    resolve(gateway);
                    break;
                case 'edit':
                    updateRoomList(gateway);
                    updateBeaconsList(gateway);
                    resolve(gateway);
                    break;
                default:
                    resolve(gateway);
            }
        }

        function handleGatewayDeletion(gateway, resolve, reject) {
            resolve([gateway, 'gateway']);
        }

        function cannotDeleteItem(beacon) {
            return false;
        }

        updateGatewayStatuses();
        updateGatewayBTStatuses();
        getControlBeacons();

    }
]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:GatewayService
 *
 * @description
 * Helper service for handling gateway-related actions
 *
 */
angular.module('ilWebClient').service('GatewayService', ['Restangular', function (Restangular) {
    this.service = Restangular.service('gateway/');
    var self = this;

    /**
     * @ngdoc method
     * @name start
     * @methodOf ilWebClient.service:GatewayService
     * @description
     * Starts a gateway
     *
     * @param {object}  gateway      Gateway object
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function start(gateway) {
        return self.service.one().customGET(gateway.id + '/start');
    }

    /**
     * @ngdoc method
     * @name stop
     * @methodOf ilWebClient.service:GatewayService
     * @description
     * Stops a gateway
     *
     * @param {object}  gateway      Gateway object
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function stop(gateway) {
        return self.service.one().customGET(gateway.id + '/stop');
    }

    /**
     * @ngdoc method
     * @name restart
     * @methodOf ilWebClient.service:GatewayService
     * @description
     * Restarts a gateway
     *
     * @param {object}  gateway      Gateway object
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function restart(gateway) {
        return self.service.one().customGET(gateway.id + '/stop_gateway');
    }

    return {
        start: start,
        stop: stop,
        restart: restart,
        getUnassigned: getUnassigned,
        getGateway:getGateway
    }

    /**
     * @returns {object} Gateways not associated with allocations(assets)
     */
    function getUnassigned(){
        return self.service.one().customGET('/unassigned/');
    }

    function getGateway(gatewayId){
        return self.service.one().customGET(gatewayId + '/find');
    }

}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:leaflet
 * @scope
 * @restrict E
 *
 * @description
 * A directive for handling leaflet rendering
 *
 */

angular.module('ilWebClient').directive('leafletMap', function () {
    return {
        scope: {
            imageOverlay: '=',
            height: '=',
            width: '=',
            features: '=',
            availableShapes: '=?',
            handleMapDrawing: '=?',
            handleMapDeleteDrawing: '=?',
            handleMapEditDrawing: '=?',
            selectDrawingToBind: '=?',
            canDraw: '=',
            canEdit: '=',
            canDelete: '=',
            containerId: '@'
        },
        restrict: 'E',
        template: '',
        link: function (scope, elem, attrs) {

            // Variables and functions
            var map;
            var drawnItems;

            // Override Circle draw shape because of bug related to distance computation when using CRS Simple coordinate reference.
            // https://github.com/Leaflet/Leaflet.draw/issues/611

            // function euclidianDistance(a, b) {
            //     var dlat = b.lat - a.lat,
            //         dlng = b.lng - a.lng;
            //     return Math.sqrt(dlat * dlat + dlng * dlng);
            // }

            // L.Draw.Circle.prototype._drawShape = function (latlng) {
            //     if (!this._shape) {
            //         this._shape = new L.Circle(this._startLatLng, euclidianDistance(this._startLatLng, latlng), this.options.shapeOptions);
            //         this._map.addLayer(this._shape);
            //     } else {
            //         this._shape.setRadius(euclidianDistance(this._startLatLng, latlng));
            //     }
            // };

            // L.Edit.Circle.prototype._resize = function (latlng) {
            //     var moveLatLng = this._moveMarker.getLatLng(),
            //         radius = euclidianDistance(moveLatLng, latlng);
            //     this._shape.setRadius(radius);
            //     this._map.fire('draw:editresize', {
            //         layer: this._shape
            //     });
            // };

            // L.Draw.Rectangle.prototype._getTooltipText = function () {
            //     var tooltipText = L.Draw.SimpleShape.prototype._getTooltipText.call(this),
            //         subtext;
            //     return {
            //         text: tooltipText.text,
            //         subtext: subtext
            //     };
            // };

            // var circleToGeoJSON = L.Circle.prototype.toGeoJSON;
            // L.Circle.include({
            //     toGeoJSON: function () {
            //         var feature = circleToGeoJSON.call(this);
            //         feature.properties = {
            //             point_type: 'circle',
            //             radius: this.getRadius()
            //         };
            //         return feature;
            //     }
            // });
            // End Override

            function initMap() {
                // Remove map before recreating
                if (map) {
                    map.remove();
                };
                if (drawnItems) {
                    drawnItems = null;
                }

                // Init map with basic information
                map = L.map(scope.containerId, {
                    crs: L.CRS.Simple,
                    minZoom: -3,
                    scrollWheelZoom: true,
                });
                var bounds = [
                    [0, 0],
                    [scope.height, scope.width]
                ];
                var options = {opacity:1.0, crossOrigin:false};
                L.imageOverlay(scope.imageOverlay, bounds, options).addTo(map);

                //L.control.scale({
                //    imperial: false
                //}).addTo(map)
                map.setView([300, 300], 0);
                setDrawingControl();
            }


            function setDrawingControl() {
                drawnItems = new L.FeatureGroup();
                // Set drawing controls
                if (scope.features && scope.features.length) {
                    var existingLayers = scope.features.map(function (feature) {
                        return L.geoJSON(feature, {
                            style: function (layer) {
                                return {
                                    color: layer.properties.typeColor
                                };
                            },
                            onEachFeature: onEachFeature
                        })
                    });
                    existingLayers.forEach(function (layerG) {
                        layerG.getLayers().forEach(function (l) {
                            drawnItems.addLayer(l);
                        })
                    })

                }
                map.addLayer(drawnItems);
                var drawControl = new L.Control.Draw({
                    position: 'topleft',
                    draw: scope.availableShapes,
                    edit: {
                        featureGroup: drawnItems,
                        edit: scope.canEdit,
                        remove: scope.canDelete
                    }
                }).addTo(map);

                if (scope.canDraw) {
                    map.on(L.Draw.Event.CREATED, scope.handleMapDrawing(drawnItems));
                }

                if (scope.canDelete) {
                    map.on(L.Draw.Event.DELETED, scope.handleMapDeleteDrawing);
                }

                if (scope.canEdit) {
                    map.on(L.Draw.Event.EDITED, scope.handleMapEditDrawing);
                }

            }

            function onEachFeature(feature, layer) {
                if (feature.properties && feature.properties.typeName) {
                    layer.bindPopup(feature.properties.typeName);
                    layer.on('mouseover', function (layerEv) {
                        layerEv.target.openPopup();
                    });
                    if (scope.canEdit || scope.canDelete) {
                        layer.on('click', function (layerEv) {
                            scope.selectDrawingToBind(layerEv.target);
                        })
                    }

                }
            }
            setTimeout(function () {
                initMap();
                scope.$apply();
            }, 1)

            scope.$on('feature.created', function (event, newFeature) {
                if (newFeature.id) {
                    scope.features.push(newFeature)
                    setTimeout(function () {
                        initMap();
                        scope.$apply();
                    }, 100)
                }
            });
            scope.$on('feature.edited', function (event, updatedFeatures) {
                scope.features = _.unionBy(updatedFeatures,  scope.features, "id");
                setTimeout(function () {
                    initMap();
                    scope.$apply();
                }, 100)
            });
            scope.$on('feature.deleted', function (event, deletedFeatures) {
                scope.features = _.differenceBy(scope.features, deletedFeatures, 'id');
                setTimeout(function () {
                    initMap();
                    scope.$apply();
                }, 100)

            })
        }
    }
})

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:LoginController
 * @description
 * Handles login functionality
 */
angular.module('ilWebClient').controller('LoginController', ['$scope', '$state', '$mdDialog', 'UserService', 'NotificationService', '$timeout', '$window', '$document', 'SocketService', 'MSG', 'HospitalThemeService', 'UtilService',
    function ($scope, $state, $mdDialog, UserService, NotificationService, $timeout, $window, $document, SocketService, MSG, HospitalThemeService, UtilService) {

        $scope.user = {
            email: '',
            password: ''
        };

        $scope.errors = [];
        $scope.isAccountLocked = false;
        $scope.lockedMessage = MSG.USER_ACC_LOCKED;
        $scope.storeIosURL = null;
        $scope.storeAndroidURL = null;

        $scope.theme = null;

        HospitalThemeService
            .loadTheme()
            .then(function(theme){
                $scope.theme = theme;
            })
            .catch(function(error){
                UtilService.showErrorNotification(error, 'Could not load hospital theme');
            });

        $scope.login = function () {
            UserService
                .login($scope.user)
                .then(storeUserData)
                .then(goToNextScreen)
                .catch(handleLoginError);
        };

        function getStoreIosURL() {
            UserService
                .getStoreIosURL()
                .then(function(response) {
                    $scope.storeIosURL = response.url;
                })
                .catch(function(error) {
                    setTimeout(getStoreURL, 30 * 1000);
                });
        }

        getStoreIosURL();

        function getStoreAndroidURL() {
            UserService
                .getStoreAndroidURL()
                .then(function(response) {
                    $scope.storeAndroidURL = response.url;
                })
                .catch(function(error) {
                    setTimeout(getStoreURL, 30 * 1000);
                });
        }

        getStoreAndroidURL();

        var loadRavenContext = function() {
            // var localUser = JSON.parse(localStorage.getItem('user'));
            // if (localUser) {
            //     Raven.setUserContext({
            //         email: localUser.email,
            //         id: localUser.id
            //     });
            // }
        };

        loadRavenContext();

        function storeUserData(userData) {
            // if (Raven) {
            //     Raven.setUserContext({
            //         email: userData.user.email,
            //         id: userData.user.id
            //     });
            // }
            $scope.errors = [];
            NotificationService.show('Login successful', 'success');
            $window.localStorage.setItem('tenantID', userData.user.tenant);
            $window.localStorage.setItem('title', userData.user.tenant.toUpperCase());
            return UserService.setCurrentUser(userData);
        }

        function goToNextScreen(userData) {
            // SocketService.connect();
            $state.go('main');
        }

        function handleLoginError(error){
            if (error.data && error.data.webErrors) {
                $scope.errors = error.data.webErrors.User;
            }
        }

        function checkRedirectForNotAllowed() {
            if ($window.localStorage.getItem('notify-token-expired') && document.referrer !== "") {
                NotificationService.show('Please log in again so you can access the application', 'error');
                $window.localStorage.clear();
            }
        }

        checkRedirectForNotAllowed();

        $timeout(function () {
            var selector = 'input[type=password]:-webkit-autofill';
            var elem = angular.element($document[0].querySelector(selector));
            if(elem.length) {
                elem.parent().addClass('md-input-has-value');
            }
        },150);
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:MainController
 * @description
 * Main view controller
 */
(function() {
        MainController.$inject = ["$scope", "$state", "$transitions", "$mdDialog", "Idle", "UserService", "NotificationService", "HospitalThemeService"];
    angular.module('ilWebClient')
        .config(['$stateProvider', 'ROLES', function($stateProvider, ROLES) {
            $stateProvider
            .state('main', {
                url: "/app",
                authenticate: true,
                acceptedRoles: [ROLES.SAD, ROLES.HAD, ROLES.HCL, ROLES.PER, ROLES.GPER],
                views: {
                    "main@": {
                        templateUrl: "js/main/main.html",
                        controller: "MainController",
                        controllerAs: 'main'
                    }
                },
            })
        }])
        .controller('MainController', MainController);

        function MainController($scope, $state, $transitions, $mdDialog, Idle, UserService, NotificationService, HospitalThemeService) {
            var main = this;

            main.toggleMenu = function() {
                main.toggle.go();
            }

            main.toggle = {};
            main.toolbarElevation = -1;
            main.navList = [
                {
                    icon: 'home',
                    label: 'Dashboard',
                    route: '.dashboard'
                },
                {
                    icon: 'settings_bluetooth',
                    label: 'Beacon Management',
                    route: '.beacon'
                },
                {
                    icon: 'supervisor_account',
                    label: 'User Management',
                    route: '.user'
                },
                {
                    icon: 'layers',
                    label: 'Floor Management',
                    route: '.floor'
                },
                {
                    icon: 'location_on',
                    label: 'Area Management',
                    route: '.room'
                },
                {
                    icon: 'bluetooth_searching',
                    label: 'Gateway Management',
                    route: '.gateway'
                },
                {
                    icon: 'web',
                    label: 'System Configuration',
                    route: '.dictionary'
                },
                {
                    icon: 'navigation',
                    label: 'Patient Flow',
                    route: '.flow'
                },
                {
                    icon: 'insert_chart',
                    label: 'Surveys',
                    route: '.survey'
                }
            ];

            // New code for design. May need optimizing
            HospitalThemeService
                .loadTheme()
                .then(function(theme){
                    main.theme = theme;
                })
                .catch(function(err){
                // TODO: handle error in loading theme
                });
                    
            UserService
                .getCurrentUser()
                .then(function (user) {
                    // TODO: Currently just setting it up for the toolbar.
                    // Not sure if we will need other instances of this later.
                    main.user = user;
            });

            $state.transitionTo('main.dashboard');

            $transitions.onSuccess({}, function(transition){
                var currentState = transition.router.stateService.current.name;

                // Instead of doing a full string comparison, I'm doing just a char comparison.
                // Will work as long as we don't have a new state that begins with d.
                if (currentState.charAt(5) === 'd' || currentState.charAt(5) === 's') {
                    main.toolbarElevation = -1;
                } else {
                    main.toolbarElevation = 1;
                }
            });

            $scope.$on('IdleStart', function () {
                // the user appears to have gone idle
            });

            $scope.$on('IdleWarn', function (e, countdown) {
                // follows after the IdleStart event, but includes a countdown until the user is considered timed out
                // the countdown arg is the number of seconds remaining until then.
                // you can change the title or display a warning dialog from here.
                // you can let them resume their session by calling Idle.watch()
            });

            $scope.$on('IdleTimeout', function () {
                // the user has timed out (meaning idleDuration + timeout has passed without any activity)
                // this is where you log them out
                $mdDialog.cancel();
                UserService
                    .invalidateToken()
                    .then(function () {
                        Raven.captureMessage('User logged out on inactivity');
                        UserService.logout();
                        NotificationService.show('You were logged out due to inactivity. Please log in again so you can access the application', 'error');
                    });
            });

            $scope.$on('IdleEnd', function () {
                // the user has come back from AFK and is doing stuff. if you are warning them, you can use this to hide the dialog
            });

            $scope.$on('Keepalive', function () {
                // do something to keep the user's session alive
            });
        }
})();

'use strict';

// POST RELEASE
// TODO(jelbourn): Demo that uses moment.js
// TODO(jelbourn): make sure this plays well with validation and ngMessages.
// TODO(jelbourn): calendar pane doesn't open up outside of visible viewport.
// TODO(jelbourn): forward more attributes to the internal input (required, autofocus, etc.)
// TODO(jelbourn): something better for mobile (calendar panel takes up entire screen?)
// TODO(jelbourn): input behavior (masking? auto-complete?)
// TODO(jelbourn): UTC mode
// TODO(jelbourn): RTL


DatePickerCtrl.$inject = ["$scope", "$element", "$attrs", "$compile", "$timeout", "$window", "$mdConstant", "$mdTheming", "$mdUtil", "$mdDateLocale", "$$mdDateUtil", "$$rAF"];
angular.module('ilWebClient')
    .directive('mdDatepickerCustom', datePickerDirective);

/**
 * @ngdoc directive
 * @name mdDatepicker
 * @module material.components.datepicker
 *
 * @param {Date} ng-model The component's model. Expects a JavaScript Date object.
 * @param {expression=} ng-change Expression evaluated when the model value changes.
 * @param {Date=} md-min-date Expression representing a min date (inclusive).
 * @param {Date=} md-max-date Expression representing a max date (inclusive).
 * @param {(function(Date): boolean)=} md-date-filter Function expecting a date and returning a boolean whether it can be selected or not.
 * @param {String=} md-placeholder The date input placeholder value.
 * @param {boolean=} ng-disabled Whether the datepicker is disabled.
 * @param {boolean=} ng-required Whether a value is required for the datepicker.
 *
 * @description
 * `<md-datepicker>` is a component used to select a single date.
 * For information on how to configure internationalization for the date picker,
 * see `$mdDateLocaleProvider`.
 *
 * This component supports [ngMessages](https://docs.angularjs.org/api/ngMessages/directive/ngMessages).
 * Supported attributes are:
 * * `required`: whether a required date is not set.
 * * `mindate`: whether the selected date is before the minimum allowed date.
 * * `maxdate`: whether the selected date is after the maximum allowed date.
 *
 * @usage
 * <hljs lang="html">
 *   <md-datepicker ng-model="birthday"></md-datepicker>
 * </hljs>
 *
 */
function datePickerDirective() {
    return {
        template: // Buttons are not in the tab order because users can open the calendar via keyboard
        // interaction on the text input, and multiple tab stops for one component (picker)
        // may be confusing.
        '<div class="md-datepicker-input-container" style="padding-bottom: 0; outline: none; cursor: pointer;" ' +
        'ng-class="{\'md-datepicker-focused\': ctrl.isFocused}" layout="row" ng-click="ctrl.openCalendarPane($event)">' +
        '<input class="md-datepicker-input" style="margin-top: 10px;font-size: inherit;min-width:130px; cursor: pointer;" ng-disabled="true" aria-haspopup="true" ' +
        'ng-focus="ctrl.setFocused(true)" ng-blur="ctrl.setFocused(false)">' +
            //'<md-button type="button" md-no-ink ' +
            //'class="md-datepicker-triangle-button md-icon-button" ' +
            //'ng-click="ctrl.openCalendarPane($event)" ' +
            //'aria-label="{{::ctrl.dateLocale.msgOpenCalendar}}">' +
            //'<div class="md-datepicker-expand-triangle"></div>' +
            //'</md-button>' +
        '</div>' +

        '<md-button class="md-datepicker-button md-icon-button" aria-label="date picker" type="button" ' +
        'tabindex="-1" aria-hidden="true" ' +
        'ng-click="ctrl.openCalendarPane($event)">' +
        '<i class="zmdi zmdi-calendar zmdi-hc-2x" style="color: rgb(158, 158, 158);"></i>' +
        '</md-button>' +

            // This pane will be detached from here and re-attached to the document body.
        '<div class="md-datepicker-calendar-pane md-whiteframe-z1">' +
        '<div class="md-datepicker-input-mask">' +
        '<div class="md-datepicker-input-mask-opaque"></div>' +
        '</div>' +
        '<div class="md-datepicker-calendar">' +
        '<md-calendar role="dialog" aria-label="{{::ctrl.dateLocale.msgCalendar}}" ' +
        'md-min-date="ctrl.minDate" md-max-date="ctrl.maxDate"' +
        'md-date-filter="ctrl.dateFilter"' +
        'ng-model="ctrl.date" ng-if="ctrl.isCalendarOpen">' +
        '</md-calendar>' +
        '</div>' +
        '</div>',
        require: ['ngModel', 'mdDatepickerCustom'],
        scope: {
            minDate: '=mdMinDate',
            maxDate: '=mdMaxDate',
            placeholder: '@mdPlaceholder',
            dateFilter: '=mdDateFilter'
        },
        controller: DatePickerCtrl,
        controllerAs: 'ctrl',
        bindToController: true,
        link: function (scope, element, attr, controllers) {
            var ngModelCtrl = controllers[0];
            var mdDatePickerCtrl = controllers[1];

            var mdInputContainer = controllers[2];
            if (mdInputContainer) {
                throw Error('md-datepicker should not be placed inside md-input-container.');
            }

            mdDatePickerCtrl.configureNgModel(ngModelCtrl);
        }
    };
}

/** Additional offset for the input's `size` attribute, which is updated based on its content. */
var EXTRA_INPUT_SIZE = 3;

/** Class applied to the container if the date is invalid. */
var INVALID_CLASS = 'md-datepicker-invalid';

/** Default time in ms to debounce input event by. */
var DEFAULT_DEBOUNCE_INTERVAL = 500;

/**
 * Height of the calendar pane used to check if the pane is going outside the boundary of
 * the viewport. See calendar.scss for how $md-calendar-height is computed; an extra 20px is
 * also added to space the pane away from the exact edge of the screen.
 *
 *  This is computed statically now, but can be changed to be measured if the circumstances
 *  of calendar sizing are changed.
 */
var CALENDAR_PANE_HEIGHT = 368;

/**
 * Width of the calendar pane used to check if the pane is going outside the boundary of
 * the viewport. See calendar.scss for how $md-calendar-width is computed; an extra 20px is
 * also added to space the pane away from the exact edge of the screen.
 *
 *  This is computed statically now, but can be changed to be measured if the circumstances
 *  of calendar sizing are changed.
 */
var CALENDAR_PANE_WIDTH = 360;

/**
 * Controller for md-datepicker.
 *
 * @ngInject @constructor
 */
function DatePickerCtrl($scope, $element, $attrs, $compile, $timeout, $window,
                        $mdConstant, $mdTheming, $mdUtil, $mdDateLocale, $$mdDateUtil, $$rAF) {
    /** @final */
    this.$compile = $compile;

    /** @final */
    this.$timeout = $timeout;

    /** @final */
    this.$window = $window;

    /** @final */
    this.dateLocale = $mdDateLocale;

    /** @final */
    this.dateUtil = $$mdDateUtil;

    /** @final */
    this.$mdConstant = $mdConstant;

    /* @final */
    this.$mdUtil = $mdUtil;

    /** @final */
    this.$$rAF = $$rAF;

    /**
     * The root document element. This is used for attaching a top-level click handler to
     * close the calendar panel when a click outside said panel occurs. We use `documentElement`
     * instead of body because, when scrolling is disabled, some browsers consider the body element
     * to be completely off the screen and propagate events directly to the html element.
     * @type {!angular.JQLite}
     */
    this.documentElement = angular.element(document.documentElement);

    /** @type {!angular.NgModelController} */
    this.ngModelCtrl = null;

    /** @type {HTMLInputElement} */
    this.inputElement = $element[0].querySelector('input');

    /** @final {!angular.JQLite} */
    this.ngInputElement = angular.element(this.inputElement);

    /** @type {HTMLElement} */
    this.inputContainer = $element[0].querySelector('.md-datepicker-input-container');

    /** @type {HTMLElement} Floating calendar pane. */
    this.calendarPane = $element[0].querySelector('.md-datepicker-calendar-pane');

    /** @type {HTMLElement} Calendar icon button. */
    this.calendarButton = $element[0].querySelector('.md-datepicker-button');

    /**
     * Element covering everything but the input in the top of the floating calendar pane.
     * @type {HTMLElement}
     */
    this.inputMask = $element[0].querySelector('.md-datepicker-input-mask-opaque');

    /** @final {!angular.JQLite} */
    this.$element = $element;

    /** @final {!angular.Attributes} */
    this.$attrs = $attrs;

    /** @final {!angular.Scope} */
    this.$scope = $scope;

    /** @type {Date} */
    this.date = null;

    /** @type {boolean} */
    this.isFocused = false;

    /** @type {boolean} */
    this.isDisabled;
    this.setDisabled($element[0].disabled || angular.isString($attrs['disabled']));

    /** @type {boolean} Whether the date-picker's calendar pane is open. */
    this.isCalendarOpen = false;

    /**
     * Element from which the calendar pane was opened. Keep track of this so that we can return
     * focus to it when the pane is closed.
     * @type {HTMLElement}
     */
    this.calendarPaneOpenedFrom = null;

    this.calendarPane.id = 'md-date-pane' + $mdUtil.nextUid();

    $mdTheming($element);

    /** Pre-bound click handler is saved so that the event listener can be removed. */
    this.bodyClickHandler = angular.bind(this, this.handleBodyClick);

    /** Pre-bound resize handler so that the event listener can be removed. */
    this.windowResizeHandler = $mdUtil.debounce(angular.bind(this, this.closeCalendarPane), 100);

    // Unless the user specifies so, the datepicker should not be a tab stop.
    // This is necessary because ngAria might add a tabindex to anything with an ng-model
    // (based on whether or not the user has turned that particular feature on/off).
    if (!$attrs['tabindex']) {
        $element.attr('tabindex', '-1');
    }

    this.installPropertyInterceptors();
    this.attachChangeListeners();
    this.attachInteractionListeners();

    var self = this;
    $scope.$on('$destroy', function () {
        self.detachCalendarPane();
    });
}

/**
 * Sets up the controller's reference to ngModelController.
 * @param {!angular.NgModelController} ngModelCtrl
 */
DatePickerCtrl.prototype.configureNgModel = function (ngModelCtrl) {
    this.ngModelCtrl = ngModelCtrl;

    var self = this;
    ngModelCtrl.$render = function () {
        var value = self.ngModelCtrl.$viewValue;

        if (value && !(value instanceof Date)) {
            throw Error('The ng-model for md-datepicker must be a Date instance. ' +
                'Currently the model is a: ' + (typeof value));
        }

        self.date = value;
        self.inputElement.value = self.dateLocale.formatDate(value);
        self.resizeInputElement();
        self.updateErrorState();
    };
};

/**
 * Attach event listeners for both the text input and the md-calendar.
 * Events are used instead of ng-model so that updates don't infinitely update the other
 * on a change. This should also be more performant than using a $watch.
 */
DatePickerCtrl.prototype.attachChangeListeners = function () {
    var self = this;

    self.$scope.$on('md-calendar-change', function (event, date) {
        self.ngModelCtrl.$setViewValue(date);
        self.date = date;
        self.inputElement.value = self.dateLocale.formatDate(date);
        self.closeCalendarPane();
        self.resizeInputElement();
        self.updateErrorState();
    });

    self.ngInputElement.on('input', angular.bind(self, self.resizeInputElement));
    // TODO(chenmike): Add ability for users to specify this interval.
    self.ngInputElement.on('input', self.$mdUtil.debounce(self.handleInputEvent,
        DEFAULT_DEBOUNCE_INTERVAL, self));
};

/** Attach event listeners for user interaction. */
DatePickerCtrl.prototype.attachInteractionListeners = function () {
    var self = this;
    var $scope = this.$scope;
    var keyCodes = this.$mdConstant.KEY_CODE;

    // Add event listener through angular so that we can triggerHandler in unit tests.
    self.ngInputElement.on('keydown', function (event) {
        if (event.altKey && event.keyCode == keyCodes.DOWN_ARROW) {
            self.openCalendarPane(event);
            $scope.$digest();
        }
    });

    $scope.$on('md-calendar-close', function () {
        self.closeCalendarPane();
    });
};

/**
 * Capture properties set to the date-picker and imperitively handle internal changes.
 * This is done to avoid setting up additional $watches.
 */
DatePickerCtrl.prototype.installPropertyInterceptors = function () {
    var self = this;

    if (this.$attrs['ngDisabled']) {
        // The expression is to be evaluated against the directive element's scope and not
        // the directive's isolate scope.
        var scope = this.$scope.$parent;

        if (scope) {
            scope.$watch(this.$attrs['ngDisabled'], function (isDisabled) {
                self.setDisabled(isDisabled);
            });
        }
    }

    Object.defineProperty(this, 'placeholder', {
        get: function () {
            return self.inputElement.placeholder;
        },
        set: function (value) {
            self.inputElement.placeholder = value || '';
        }
    });
};

/**
 * Sets whether the date-picker is disabled.
 * @param {boolean} isDisabled
 */
DatePickerCtrl.prototype.setDisabled = function (isDisabled) {
    this.isDisabled = isDisabled;
    this.inputElement.disabled = isDisabled;
    this.calendarButton.disabled = isDisabled;
};

/**
 * Sets the custom ngModel.$error flags to be consumed by ngMessages. Flags are:
 *   - mindate: whether the selected date is before the minimum date.
 *   - maxdate: whether the selected flag is after the maximum date.
 *   - filtered: whether the selected date is allowed by the custom filtering function.
 *   - valid: whether the entered text input is a valid date
 *
 * The 'required' flag is handled automatically by ngModel.
 *
 * @param {Date=} opt_date Date to check. If not given, defaults to the datepicker's model value.
 */
DatePickerCtrl.prototype.updateErrorState = function (opt_date) {
    var date = opt_date || this.date;

    // Clear any existing errors to get rid of anything that's no longer relevant.
    this.clearErrorState();

    if (this.dateUtil.isValidDate(date)) {
        // Force all dates to midnight in order to ignore the time portion.
        date = this.dateUtil.createDateAtMidnight(date);

        if (this.dateUtil.isValidDate(this.minDate)) {
            var minDate = this.dateUtil.createDateAtMidnight(this.minDate);
            this.ngModelCtrl.$setValidity('mindate', date >= minDate);
        }

        if (this.dateUtil.isValidDate(this.maxDate)) {
            var maxDate = this.dateUtil.createDateAtMidnight(this.maxDate);
            this.ngModelCtrl.$setValidity('maxdate', date <= maxDate);
        }

        if (angular.isFunction(this.dateFilter)) {
            this.ngModelCtrl.$setValidity('filtered', this.dateFilter(date));
        }
    } else {
        // The date is seen as "not a valid date" if there is *something* set
        // (i.e.., not null or undefined), but that something isn't a valid date.
        this.ngModelCtrl.$setValidity('valid', date == null);
    }

    // TODO(jelbourn): Change this to classList.toggle when we stop using PhantomJS in unit tests
    // because it doesn't conform to the DOMTokenList spec.
    // See https://github.com/ariya/phantomjs/issues/12782.
    if (!this.ngModelCtrl.$valid) {
        this.inputContainer.classList.add(INVALID_CLASS);
    }
};

/** Clears any error flags set by `updateErrorState`. */
DatePickerCtrl.prototype.clearErrorState = function () {
    this.inputContainer.classList.remove(INVALID_CLASS);
    ['mindate', 'maxdate', 'filtered', 'valid'].forEach(function (field) {
        this.ngModelCtrl.$setValidity(field, true);
    }, this);
};

/** Resizes the input element based on the size of its content. */
DatePickerCtrl.prototype.resizeInputElement = function () {
    this.inputElement.size = this.inputElement.value.length + EXTRA_INPUT_SIZE;
};

/**
 * Sets the model value if the user input is a valid date.
 * Adds an invalid class to the input element if not.
 */
DatePickerCtrl.prototype.handleInputEvent = function () {
    var inputString = this.inputElement.value;
    var parsedDate = inputString ? this.dateLocale.parseDate(inputString) : null;
    this.dateUtil.setDateTimeToMidnight(parsedDate);

    // An input string is valid if it is either empty (representing no date)
    // or if it parses to a valid date that the user is allowed to select.
    var isValidInput = inputString == '' || (
            this.dateUtil.isValidDate(parsedDate) &&
            this.dateLocale.isDateComplete(inputString) &&
            this.isDateEnabled(parsedDate)
        );

    // The datepicker's model is only updated when there is a valid input.
    if (isValidInput) {
        this.ngModelCtrl.$setViewValue(parsedDate);
        this.date = parsedDate;
    }

    this.updateErrorState(parsedDate);
};

/**
 * Check whether date is in range and enabled
 * @param {Date=} opt_date
 * @return {boolean} Whether the date is enabled.
 */
DatePickerCtrl.prototype.isDateEnabled = function (opt_date) {
    return this.dateUtil.isDateWithinRange(opt_date, this.minDate, this.maxDate) &&
        (!angular.isFunction(this.dateFilter) || this.dateFilter(opt_date));
};

/** Position and attach the floating calendar to the document. */
DatePickerCtrl.prototype.attachCalendarPane = function () {
    var calendarPane = this.calendarPane;
    calendarPane.style.transform = '';
    this.$element.addClass('md-datepicker-open');

    var elementRect = this.inputContainer.getBoundingClientRect();
    var bodyRect = document.body.getBoundingClientRect();

    // Check to see if the calendar pane would go off the screen. If so, adjust position
    // accordingly to keep it within the viewport.
    var paneTop = elementRect.top - bodyRect.top;
    var paneLeft = elementRect.left - bodyRect.left;

    // If ng-material has disabled body scrolling (for example, if a dialog is open),
    // then it's possible that the already-scrolled body has a negative top/left. In this case,
    // we want to treat the "real" top as (0 - bodyRect.top). In a normal scrolling situation,
    // though, the top of the viewport should just be the body's scroll position.
    var viewportTop = (bodyRect.top < 0 && document.body.scrollTop == 0) ?
        -bodyRect.top :
        document.body.scrollTop;

    var viewportLeft = (bodyRect.left < 0 && document.body.scrollLeft == 0) ?
        -bodyRect.left :
        document.body.scrollLeft;

    var viewportBottom = viewportTop + this.$window.innerHeight;
    var viewportRight = viewportLeft + this.$window.innerWidth;

    // If the right edge of the pane would be off the screen and shifting it left by the
    // difference would not go past the left edge of the screen. If the calendar pane is too
    // big to fit on the screen at all, move it to the left of the screen and scale the entire
    // element down to fit.
    if (paneLeft + CALENDAR_PANE_WIDTH > viewportRight) {
        if (viewportRight - CALENDAR_PANE_WIDTH > 0) {
            paneLeft = viewportRight - CALENDAR_PANE_WIDTH;
        } else {
            paneLeft = viewportLeft;
            var scale = this.$window.innerWidth / CALENDAR_PANE_WIDTH;
            calendarPane.style.transform = 'scale(' + scale + ')';
        }

        calendarPane.classList.add('md-datepicker-pos-adjusted');
    }

    // If the bottom edge of the pane would be off the screen and shifting it up by the
    // difference would not go past the top edge of the screen.
    if (paneTop + CALENDAR_PANE_HEIGHT > viewportBottom &&
        viewportBottom - CALENDAR_PANE_HEIGHT > viewportTop) {
        paneTop = viewportBottom - CALENDAR_PANE_HEIGHT;
        calendarPane.classList.add('md-datepicker-pos-adjusted');
    }

    calendarPane.style.left = paneLeft + 'px';
    calendarPane.style.top = paneTop + 'px';
    document.body.appendChild(calendarPane);

    // The top of the calendar pane is a transparent box that shows the text input underneath.
    // Since the pane is floating, though, the page underneath the pane *adjacent* to the input is
    // also shown unless we cover it up. The inputMask does this by filling up the remaining space
    // based on the width of the input.
    this.inputMask.style.left = elementRect.width + 'px';

    // Add CSS class after one frame to trigger open animation.
    this.$$rAF(function () {
        calendarPane.classList.add('md-pane-open');
    });
};

/** Detach the floating calendar pane from the document. */
DatePickerCtrl.prototype.detachCalendarPane = function () {
    this.$element.removeClass('md-datepicker-open');
    this.calendarPane.classList.remove('md-pane-open');
    this.calendarPane.classList.remove('md-datepicker-pos-adjusted');

    if (this.isCalendarOpen) {
        this.$mdUtil.enableScrolling();
    }

    if (this.calendarPane.parentNode) {
        // Use native DOM removal because we do not want any of the angular state of this element
        // to be disposed.
        this.calendarPane.parentNode.removeChild(this.calendarPane);
    }
};

/**
 * Open the floating calendar pane.
 * @param {Event} event
 */
DatePickerCtrl.prototype.openCalendarPane = function (event) {
    if (!this.isCalendarOpen && !this.isDisabled) {
        this.isCalendarOpen = true;
        this.calendarPaneOpenedFrom = event.target;

        // Because the calendar pane is attached directly to the body, it is possible that the
        // rest of the component (input, etc) is in a different scrolling container, such as
        // an md-content. This means that, if the container is scrolled, the pane would remain
        // stationary. To remedy this, we disable scrolling while the calendar pane is open, which
        // also matches the native behavior for things like `<select>` on Mac and Windows.
        this.$mdUtil.disableScrollAround(this.calendarPane);

        this.attachCalendarPane();
        this.focusCalendar();

        // Attach click listener inside of a timeout because, if this open call was triggered by a
        // click, we don't want it to be immediately propogated up to the body and handled.
        var self = this;
        this.$mdUtil.nextTick(function () {
            // Use 'touchstart` in addition to click in order to work on iOS Safari, where click
            // events aren't propogated under most circumstances.
            // See http://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
            self.documentElement.on('click touchstart', self.bodyClickHandler);
        }, false);

        window.addEventListener('resize', this.windowResizeHandler);
    }
};

/** Close the floating calendar pane. */
DatePickerCtrl.prototype.closeCalendarPane = function () {
    if (this.isCalendarOpen) {
        this.detachCalendarPane();
        this.isCalendarOpen = false;
        this.calendarPaneOpenedFrom.focus();
        this.calendarPaneOpenedFrom = null;

        this.ngModelCtrl.$setTouched();

        this.documentElement.off('click touchstart', this.bodyClickHandler);
        window.removeEventListener('resize', this.windowResizeHandler);
    }
};

/** Gets the controller instance for the calendar in the floating pane. */
DatePickerCtrl.prototype.getCalendarCtrl = function () {
    return angular.element(this.calendarPane.querySelector('md-calendar')).controller('mdCalendar');
};

/** Focus the calendar in the floating pane. */
DatePickerCtrl.prototype.focusCalendar = function () {
    // Use a timeout in order to allow the calendar to be rendered, as it is gated behind an ng-if.
    var self = this;
    this.$mdUtil.nextTick(function () {
        self.getCalendarCtrl().focus();
    }, false);
};

/**
 * Sets whether the input is currently focused.
 * @param {boolean} isFocused
 */
DatePickerCtrl.prototype.setFocused = function (isFocused) {
    if (!isFocused) {
        this.ngModelCtrl.$setTouched();
    }
    this.isFocused = isFocused;
};

/**
 * Handles a click on the document body when the floating calendar pane is open.
 * Closes the floating calendar pane if the click is not inside of it.
 * @param {MouseEvent} event
 */
DatePickerCtrl.prototype.handleBodyClick = function (event) {
    if (this.isCalendarOpen) {
        // TODO(jelbourn): way want to also include the md-datepicker itself in this check.
        var isInCalendar = this.$mdUtil.getClosest(event.target, 'md-calendar');
        if (!isInCalendar) {
            this.closeCalendarPane();
        }

        this.$scope.$digest();
    }
};

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:MetricsController
 * @description
 * Handles viewing of metrics information - admin use
 */
angular
    .module('ilWebClient')
    .controller('MetricsController', JhiMetricsMonitoringController);

JhiMetricsMonitoringController.$inject = ['$scope', 'MetricsService', '$mdDialog'];

function JhiMetricsMonitoringController($scope, JhiMetricsService, $mdDialog) {
    var vm = this;

    vm.cachesStats = {};
    vm.metrics = {};
    vm.refresh = refresh;
    vm.refreshThreadDumpData = refreshThreadDumpData;
    vm.servicesStats = {};
    vm.updatingMetrics = true;

    vm.refresh();

    $scope.$watch('vm.metrics', function (newValue) {
        vm.servicesStats = {};
        vm.cachesStats = {};
        angular.forEach(newValue.timers, function (value, key) {
            if (key.indexOf('web.controller') !== -1 || key.indexOf('gateway_server') !== -1) {
                vm.servicesStats[key] = value;
            }
        });
    });

    function refresh() {
        vm.updatingMetrics = true;
        JhiMetricsService.getMetrics().then(function (promise) {
            vm.metrics = promise;
            vm.updatingMetrics = false;
        }, function (promise) {
            vm.metrics = promise.data;
            vm.updatingMetrics = false;
        });
    }

    function refreshThreadDumpData() {
        JhiMetricsService.threadDump().then(function (data) {
            $mdDialog.show({
                    templateUrl: 'js/metrics/metrics.modal.html',
                    controller: 'JhiMetricsMonitoringModalController',
                    controllerAs: 'vm',
                    parent: angular.element(document.body),
                    locals: {},
                    bindToController: true,
                    escapeToClose: false,
                    fullscreen: true
                })
                .then(function (result) {

                }, function () {
                    //TODO: any cleanup after cancel
                });
        });
    }
}

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:JhiMetricsMonitoringModalController
 * @description
 * Handles viewing of metrics information in modal
 */
angular
    .module('ilWebClient')
    .controller('JhiMetricsMonitoringModalController', JhiMetricsMonitoringModalController);

JhiMetricsMonitoringModalController.$inject = ['$mdDialog', 'MetricsService'];

function JhiMetricsMonitoringModalController($mdDialog, MetricsService) {
    var vm = this;

    vm.cancel = $mdDialog.cancel;
    vm.getLabelClass = getLabelClass;
    vm.threadDump = [];
    vm.threadDumpAll = 0;
    vm.threadDumpBlocked = 0;
    vm.threadDumpRunnable = 0;
    vm.threadDumpTimedWaiting = 0;
    vm.threadDumpWaiting = 0;

    MetricsService.threadDump().then(function (response) {
        vm.threadDump = response.data;
        angular.forEach(response.data, function (value) {
            if (value.threadState === 'RUNNABLE') {
                vm.threadDumpRunnable += 1;
            } else if (value.threadState === 'WAITING') {
                vm.threadDumpWaiting += 1;
            } else if (value.threadState === 'TIMED_WAITING') {
                vm.threadDumpTimedWaiting += 1;
            } else if (value.threadState === 'BLOCKED') {
                vm.threadDumpBlocked += 1;
            }
        });
    });

    vm.threadDumpAll = vm.threadDumpRunnable + vm.threadDumpWaiting + vm.threadDumpTimedWaiting + vm.threadDumpBlocked;

    function getLabelClass(threadState) {
        if (threadState === 'RUNNABLE') {
            return 'label-success';
        } else if (threadState === 'WAITING') {
            return 'label-info';
        } else if (threadState === 'TIMED_WAITING') {
            return 'label-warning';
        } else if (threadState === 'BLOCKED') {
            return 'label-danger';
        }
    }
}

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:MetricsService
 *
 * @description
 * Service for handling metrics info retrieval from server
 */
angular
    .module('ilWebClient')
    .factory('MetricsService', JhiMetricsService);

JhiMetricsService.$inject = ['$http', 'API_URL'];

function JhiMetricsService($http, API_URL) {
    return {
        getMetrics: getMetrics,
        threadDump: threadDump
    };

    function getMetrics() {
        return $http.get(API_URL + '/metrics/').then(function (response) {
            return response.data;
        });
    }

    function threadDump() {
        return $http.get(API_URL + '/dump');
    }
}

'use strict';

/**
 * @ngdoc service
 * @name NotificationModule.service:NotificationService
 *
 * @description
 * Exposes notification builder function
 *
 */
angular.module('NotificationModule', ['ngMaterial'])
    .factory('NotificationService', ['$mdToast', '$timeout', function ($mdToast,$timeout) {

        /**
         * @name getOptions
         * @param {string} message
         * @param {string} type
         * @param {number} delay
         * @param {string} position
         * @param {*} parent
         * @returns {{hideDelay: (*|number), position: (*|string), template: string, parent: *}}
         */
        var getOptions = function (message, type, delay, position, parent) {
            var toastClass;

            switch (type) {
                case 'error':
                    toastClass = 'error';
                    break;
                case 'success':
                    toastClass = 'success';
                    break;
            }

            return {
                hideDelay: delay || 3000,
                position: position || "bottom right",
                template: '<md-toast class="md-toast ' + toastClass + '"><span>'+  message + '</span></md-toast>',
                parent: parent
            }
        };

        var lastMessage = '';
        var clearLastMessageTimeout = 3000;

        return {
            /**
             * @ngdoc method
             * @name show
             * @methodOf NotificationModule.service:NotificationService
             * @description
             * Takes some options to display a notification toast
             *
             * @param {string}  text        Text to display in notification
             * @param {string}  type        Type of notification ('error', 'success')
             * @param {number}  delay       Show after delay
             * @param {string}  position    Position of notification
             *
             */
            show: function (text, type, delay, position) {
                $timeout(function () {
                    lastMessage = '';
                },clearLastMessageTimeout);
                if(lastMessage !== text) {
                    lastMessage = text;
                    return $mdToast.show(getOptions(text, type, delay, position));
                }
                lastMessage = text;
            }
        };
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:PasswordManagementController
 * @description
 * Handles password reset and new user registration states
 */
angular.module('ilWebClient').controller('PasswordManagementController', ['$scope', '$state', '$mdDialog', '$stateParams', 'UserService', 'NotificationService', 'MSG', 'HospitalThemeService',
    function ($scope, $state, $mdDialog, $stateParams, UserService, NotificationService, MSG, HospitalThemeService) {

        $scope.requestPasswordReset = requestPasswordReset;
        $scope.setNewPassword = setNewPassword;
        $scope.passwordsMatch = passwordsMatch;
        $scope.canSubmitPassword = canSubmitPassword;
        $scope.backToLogin = backToLogin;
        $scope.showExpiredTokenMessage = false;
        $scope.passwordRequestMsg = null;
        $scope.validationErrors = null;
        $scope.isRequestingReset = $stateParams.token === undefined;
        $scope.resetObject = {email: ''};
        $scope.newPasswordObject = {};
        $scope.theme = null;

        var passwordResetToken = $stateParams.token;
        var passwordResetEndpoint = $state.$current.name;

        if (passwordResetToken) {
            checkUserEmailToken();
        }

        HospitalThemeService
            .loadTheme()
            .then(function(theme){
                $scope.theme = theme;
            })
            .catch(function(err){
                // TODO: handle error in loading theme
            });

        $scope.passwordConditions = {
            hasRequiredLength: function (string) {
                return string && string.length >= 8;
            },
            hasLowerCaseChar: function (string) {
                return string && (/[a-z]/.test(string));
            },
            hasUpperCaseChar: function (string) {
                return string && (/[A-Z]/.test(string));
            },
            hasSpecialChar: function (string) {
                return string && /[$!#@%&*]/.test(string);
            },
            hasNumber: function (string) {
                return string && (/[0-9]/.test(string));
            },
            meetsConditions: function (string) {
                var count = 0, truthArray = [
                    this.hasLowerCaseChar(string),
                    this.hasUpperCaseChar(string),
                    this.hasNumber(string),
                    this.hasSpecialChar(string)
                ];

                for (var i = 0; i < truthArray.length; i++) {
                    if (truthArray[i]) {
                        count += 1;
                    }
                }

                return count >= 3;
            }
        };

        function canSubmitPassword(string) {
            return string && $scope.passwordConditions.hasRequiredLength(string) && $scope.passwordConditions.meetsConditions(string) && passwordsMatch();
        }

        function checkUserEmailToken() {
            $scope.showExpiredTokenMessage = false;
            UserService
                .checkEmailToken(passwordResetToken, !$scope.isRequestingReset)
                .then(handleTokenCheckResult)
                .catch(handleTokenCheckError);
        }

        function handleTokenCheckResult(result) {
            // do nothing for now
        }

        function handleTokenCheckError(error) {
            switch (error.status) {
                case 400:
                    $scope.showExpiredTokenMessage = true;
                    break;
                case 408:
                    NotificationService.show(MSG.REQUEST_TIMEOUT, 'error');
                    break;
                default:
                    NotificationService.show(MSG.URL_CHECK_FAILED, 'error');
                    break;
            }
        }

        /**
         * Requests the password to be reset for a specific user
         */
        function requestPasswordReset() {
            UserService
                .requestPasswordReset($scope.resetObject.email)
                .then(passwordResetSuccess)
                .catch(handleResetRequestError);
        }

        /**
         * sends the new password to the server to update user information
         */
        function setNewPassword() {
            $scope.validationErrors = null;
            UserService
                .setNewPassword($scope.newPasswordObject.newPassword, passwordResetToken, passwordResetEndpoint)
                .then(newPasswordSuccess)
                .catch(handlePasswordResetError);
        }

        function passwordResetSuccess(result) {
            $scope.passwordRequestMsg = MSG.EMAIL_SENT_CONFIRMATION;
        }

        function newPasswordSuccess(result) {
            NotificationService.show(MSG.PWD_SET_CONFIRMATION, 'success');
            $state.transitionTo("login");
        }

        function handleResetRequestError(error) {
            $scope.passwordRequestMsg = MSG.PWD_SET_ERR;
        }

        function handlePasswordResetError(error) {
            $scope.validationErrors = error.data.webErrors;
        }

        function passwordsMatch() {
            return $scope.newPasswordObject.newPassword === $scope.newPasswordObject.confirmNewPassword;
        }

        function backToLogin() {
            $state.transitionTo("login");
        }

    }]);

'use strict';

//TODO: refactor this controller;

/**
 * @ngdoc controller
 * @name ilWebClient.controller:EntityFormController
 * @description
 * Entity controller used for handling entity create/update forms - contains general logic associated to these actions
 */
angular.module('ilWebClient').controller('RoomEntityFormController', ['$scope','Restangular',  function ($scope, Restangular) {
    $scope.addNewAssetType = addNewAssetType;
    $scope.removeAssetTypeMapping = removeAssetTypeMapping;
    $scope.validateAssetMapping = validateAssetMapping;
    $scope.addNewStatus = addNewStatus;
    $scope.assetStatusesForAssetType = {};
    $scope.formIsValid = true;
    onLoad();

    function addNewStatus(status){
        var roomAssetStatus = {id:null, name:status}
        Restangular.one('/room/defaultAssetStatus/').customPUT(roomAssetStatus).then(function(roomStatus){
            $scope.formOptions.roomDefaultAssetStatuses.push(roomAssetStatus);
            $scope.model.assetStatus = roomAssetStatus;
        });

    }

    function validateAssetMapping(assetMapping,index){
        $scope.assetTypeValidationError = {};
        var count=-1;
        $scope.formIsValid = true;
        $scope.model.assetMappings.forEach(function (mapping){
            count++;
            if(count != index && mapping.assetType.name == assetMapping.assetType.name){
                $scope.assetTypeValidationError[index] = "This asset type is already assigned.";
                assetMapping.assetStatus = null;
                $scope.formIsValid = false;
                return;
            }
        })
    }

    function addNewAssetType(){
        if(!$scope.model.assetMappings){
            $scope.model.assetMappings = [];
        }
        $scope.model.assetMappings.push({id:null})
    }

    function removeAssetTypeMapping(assetTypeMapping){
        $scope.model.assetMappings.splice($scope.model.assetMappings.indexOf(assetTypeMapping),1);
        var index = -1;
        $scope.model.assetMappings.forEach(function(mapping){
          validateAssetMapping(mapping, ++index);
        })
    }

    function loadAssetStatusesForAssetType(){
        $scope.formOptions.assetTypes.forEach(function(assetType){
            Restangular.all('dictionary/asset/type/' + assetType.id + '/statusObj').getList().then(function (statusesList) {
                var tmp = [];
                for (var i = 0; i < statusesList.length; i++) {
                    tmp.push({
                        status: statusesList[i].status,
                        isDefault: statusesList[i].isDefault,
                        id: statusesList[i].id
                    });
                }
                $scope.assetStatusesForAssetType[assetType.id] = tmp;
            });
        })
    };

    function updateRoomDefaultStatuses(){
        Restangular.all('room/defaultAssetStatuses/').getList().then(function(defaultStatusList){
            $scope.formOptions.roomDefaultAssetStatuses = defaultStatusList;
            $scope.formOptions.roomDefaultAssetStatuses.filter(function(assetStatus){
                if(assetStatus.name === $scope.model.assetStatus){
                    $scope.model.assetStatus = assetStatus;
                }
            })
        })
    }

    function onLoad(){
        loadAssetStatusesForAssetType();
        updateRoomDefaultStatuses();
    }

}])

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:FingerprintsInfoController
 * @description
 * Handles fingerprinting info displayed for areas
 */
angular.module('ilWebClient').controller('FingerprintsInfoController', ['$scope', '$mdDialog', 'model', 'FingerprintService', 'NotificationService',
    function ($scope, $mdDialog, model, FingerprintService, NotificationService) {
        $scope.close = $mdDialog.cancel;
        $scope.model = model;
        $scope.update = updateFingerprint;
        $scope.delete = deleteFingerprint;
        $scope.setProperty = setProperty;
        $scope.isEnabled = isEnabled;

        function isEnabled(key) {
            return (key == 'deviation') || (key == 'average');
        }

        function setProperty(object, key, value) {
            if (object && key && value) {
                object[key] = value;
            }
        }

        function updateFingerprint(fingerprint) {
            FingerprintService
                .updateFingerprint(fingerprint)
                .then(showSuccess('Updated fingerprint #' + fingerprint.id))
                .catch(showError('Could not update fingerprint #' + fingerprint.id));
        }

        function deleteFingerprint(fingerprint) {
            var options = {
                title: 'Delete fingerprint',
                body: 'Are you sure you want to delete this? It cannot be undone.'
            };

            openConfirmationModal(options, function () {
                FingerprintService
                    .deleteFingerprint(fingerprint)
                    .then(handleDeletion(fingerprint))
                    .catch(showError('Could not delete fingerprint #' + fingerprint.id));
            });
        }

        function openConfirmationModal(options, callback) {
            var confirmDialog = $mdDialog.confirm()
                .title(options.title)
                .htmlContent('\<span class="modal-custom-body">' + options.body + '\</span>')
                .ariaLabel('Confirm')
                .ok('DELETE')
                .cancel('Cancel');
            $mdDialog.show(confirmDialog).then(function () {
                if (typeof callback === 'function') {
                    callback();
                }
            });
        }

        function handleDeletion(fingerprint) {
            return function(response) {
                showSuccess('Deleted fingerprint #' + fingerprint.id);
            };
        }

        function showSuccess(message) {
            NotificationService.show(message, 'success');
        }

        function showError(message) {
            return function (err) {
                NotificationService.show(message, 'error');
            }
        }
    }]);

'use strict';

angular.module('ilWebClient').service('FingerprintService', ['Restangular', '$http', 'API_URL', function (Restangular, $http, API_URL) {

    /**
     * Update a fingerprint
     * @returns promise
     */
    this.updateFingerprint = function (fp) {
        return Restangular.one('room/fingerprints').customPUT(fp);
    };

    /**
     * Delete a fingerprint
     * @returns promise
     */
    this.deleteFingerprint = function (fp) {
        return $http({ url: API_URL + '/room/fingerprints/' + fp.id,
            method: 'DELETE',
            data: fp,
            headers: {"Content-Type": "application/json;charset=utf-8"}
        })
    };

}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:RoomController
 * @description
 * Handles CRUD for areas (rooms)
 */
angular.module('ilWebClient').controller('RoomController', ['$scope', 'CrudFactory', 'UserService', '$mdDialog', 'UtilService', 'NotificationService',
    function ($scope, CrudFactory, UserService, $mdDialog, UtilService, NotificationService) {
        $scope.ROLES = UserService.getRoles();
        $scope.preActionHook = preActionHook;
        $scope.cannotDeleteItem = cannotDeleteItem;

        console.log('ehre');

        $scope.columns = {
            'name': {
                'name': 'Name',
                'orderBy': 'name'
            },
            'description': {
                'name': 'description'
            },
            'parent': {
                'name': 'Parent',
                'displayProperty': 'name'
            },
            'floorName':{
                'name': 'floor'
            },
            'gatewayNames': {
                'name': 'Gateways'
            }
        };

        $scope.actions = [{
            title: 'View fingerprints info',
            action: 'start',
            icon: {
                'zmdi-info': true
            },
            color: 'green',
            callback: getInfo,
            shouldBeHidden: disableGreenButton
        },{
            title: 'View fingerprints info',
            action: 'start',
            icon: {
                'zmdi-info': true
            },
            color: 'red',
            callback: getInfo,
            shouldBeHidden: disableRedButton
        }];

        function getInfo(room) {
            UtilService
                .loadRoomInfo(room)
                .then(showInfo)
                .catch(function(error) {
                    UtilService.showErrorNotification(error, 'Could not load fingerprints info');
                });
        }

        function showInfo(fingerprintingArray) {
            var model = fingerprintingArray || {};

            if (fingerprintingArray && fingerprintingArray.length === 0) {
                NotificationService.show('No fingerprints available for this area', 'success');
            } else {
                $mdDialog.show({
                    templateUrl: 'js/room/fingerprints.html',
                    controller: 'FingerprintsInfoController',
                    parent: angular.element(document.body),
                    locals: {
                        model: model
                    },
                    bindToController: true,
                    escapeToClose: true,
                    fullscreen: true
                })
                    .then(function (result) {
                        // do nothing
                    }, function () {
                        // do nothing
                    });
            }
        }

        function disableGreenButton(room) {
            var isButtonGreen = room.hasFingerprints && !room.hasInvalidFingerprints;
            return !$scope.ROLES.SAD || !isButtonGreen;
        }

        function disableRedButton(room) {
            var isButtonRen = room.hasFingerprints && room.hasInvalidFingerprints;
            return !$scope.ROLES.SAD || !isButtonRen;
        }

        $scope.filterConfig = {
            parentRooms: {
                type: 'select',
                column: 'parentRoom',
                placeholder: 'by Parent Area',
                allowMultipleSelection: true,
                values: []
            }
        };

        $scope.formOptions = {
            rooms: [],
            assetTypes: [],
            roomDefaultAssetStatuses: [],
            statuses: [],
            gateways: [],
            colors: [
                {
                    name: 'Blue',
                    hex: '#89c5f5',
                    textColor: '#ffffff',
                    selected: false
                },{
                    name: 'Grey',
                    hex: '#A1A2A6',
                    textColor: '#000000',
                    selected: false
                },
                {
                    name: 'Pink',
                    hex: '#fe9fdc',
                    textColor: '#000000',
                    selected: false
                },
                {
                    name: 'Yellow',
                    hex: '#ffe44a',
                    textColor: '#000000',
                    selected: false
                },
                {
                    name: 'Purple',
                    hex: '#8D68B6',
                    textColor: '#ffffff',
                    selected: false
                },
                {
                    name: 'Green',
                    hex: '#D5FF97',
                    textColor: '#000000',
                    selected: false
                }
            ]
        };


        $scope.options = {
            query: {
                order: '',
                limit: 15,
                page: 1
            }
        };


        updateRoomList();


        $scope.$on('crud.updated.room', function () {
            updateParentRoomList();
            updateRoomList();
        });

        $scope.$on('crud.created.room', function () {
            updateRoomList();
        });
        $scope.$on('crud.deleted.room', function () {
            updateParentRoomList();
            updateRoomList();
        });

        $scope.$on('crud.intermediaryDialog.close', function (event, data) {
            updateRoomList(data);
        });

        $scope.$on('crud.dialog.open.room', function (event, data) {
            updateRoomList(data);
        });

        $scope.$on('crud.dialog.close.room', function (event, data) {
            resetColors();
        });

        function resetColors() {
            $scope.formOptions.colors.forEach(function(item){
                item.selected = false;
            });
        }

        function updateRoomList(data) {
            var restService = new CrudFactory.CrudRest('room');
            var hospitalId = (data && data.hospital) ? data.hospital.id : undefined;
            restService.list({hasParents: false, hospital: hospitalId}).then(function (roomList) {
                $scope.formOptions.rooms = roomList;
            });
        }

        function updateParentRoomList() {
            var restService = new CrudFactory.CrudRest('room');
            restService.list({hasChildren: true}).then(function (roomList) {
                var tmp = [];
                // if (roomList.length > $scope.filterConfig.parentRooms.values) {
                    for (var i = 0; i < roomList.length; i++) {
                        tmp.push({
                            name: roomList[i].name,
                            value: roomList[i].id
                        });
                    }

                    $scope.filterConfig.parentRooms.values = tmp;
                // }
            });
        }

        function updateAssetTypes(data) {
            var assetTypeRestService = new CrudFactory.CrudRest('dictionary/asset/type');
            var filter = {processingType:'LOCATION'};
            if (data && data.hospital) {
                filter.hospital = data.hospital.id;
            }
            assetTypeRestService.list(filter).then(function (assetTypeList) {
                var tmp = [];
                for (var i = 0; i < assetTypeList.length; i++) {
                    tmp.push({
                        name: assetTypeList[i].name,
                        id: assetTypeList[i].id
                    });
                }
                $scope.formOptions.assetTypes = tmp;
            })
        }

        function preActionHook(room, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    handleRoomDeletion(room, resolve, reject);
                    break;
                case 'create':
                    resolve(room);
                    break;
                case 'edit':
                    updateAssetTypes(room);
                    resolve(room);
                    break;
                default:
                    resolve(room);
            }
        }

        function handleRoomDeletion(room, resolve, reject) {
            if (room.gatewayNames && room.gatewayNames.length > 0) {
                var options = {
                    title: 'Remove area',
                    body: 'You cannot remove an area with one or more gateways associated.'
                };
                UtilService.openAlertModal(options);
            } else if (room.hasChildren) {
                var options = {
                    title: 'Remove area',
                    body: 'You cannot remove a parent area.'
                };
                UtilService.openAlertModal(options);
            } else {
                resolve([room, 'area']);
            }
        }

        function cannotDeleteItem(room) {
            return ((room.gatewayNames && room.gatewayNames.length > 0) || (room.hasChildren));
        }

        updateAssetTypes();
        updateParentRoomList();
    }]);
'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:FilterRetrievalService
 * @description
 * Service to recieve filters that can be applied to the current page.
 */
(function() {
    FilterRetrieval.$inject = ["$state", "CrudFactory"];
    angular.module('ilWebClient')
    .service("FilterRetrievalService", FilterRetrieval)

    function FilterRetrieval($state, CrudFactory) {
        var filters = []; // Singleton filters list that gets cleared and updated per call

        this.getFiltersForState = function(state) {
            var p;
            filters = []; 

            if (state === 'main.dashboard.assets') {
                    p = getAssetFilters();
            } else if (state ==='main.dashboard.patients') {
                    p = getPatientFilters();
            } else {
                p = Promise.reject();
                console.log(state);
            }

            return p;
        }

        this.getFilters = function() {
            this.getFilterForState($state.current.name);
        }

        function getCommonFilters() {
            // At the moment, room is common amongst all pages.
            var roomListRestService = new CrudFactory.CrudRest('room');

            return roomListRestService.list()
                .then(function (roomList) {
                    prepareFilterObject('Location', roomList);
                });
        }

        function getAssetFilters() {
            return getCommonFilters()
                .then(function() {
                    var assetTypeRestService= new CrudFactory.CrudRest('dictionary/asset/type');
                    return assetTypeRestService.list()
                })
                .then(function (assetTypes) {
                    prepareFilterObject('Asset Type', assetTypes);

                    return Promise.resolve();
                })
                .then(function() {
                    // TODO: will need this i think in future queries.
                    var endpointUrl = /*id ? 'dictionary/asset/type/' + id + '/statusObj' :*/ 'dictionary/asset/type/status';
                    var restService = new CrudFactory.CrudRest(endpointUrl);
                    return restService.list();
                })
                .then(function (statusList) {
                    prepareFilterObject('Status', statusList);

                    return Promise.resolve(filters);
                });
        }

        function getPatientFilters() {
            return getCommonFilters()
            .then(function() {
                var physiciansRestService = new CrudFactory.CrudRest('user/doctor');
                return physiciansRestService.list();
            })
            .then(function (physicianList) {
                prepareFilterObject('Physian', physicianList);

                return Promise.resolve(filters);
            })
            // TODO: Include patient type when backend supports it.
        }

        function prepareFilterObject(filterName, restResponse) {
            var filterObject = {
                title: filterName,
                options: []
            };

            for (var i = 0; i < restResponse.length; i++) {
                if (typeof restResponse[i] === 'object') {
                    filterObject.options.push({
                        label: restResponse[i].name,
                        id: restResponse[i].id,
                        count: 'N/A' // TODO: include count when backend has it.
                    });
                } else {
                    filterObject.options.push({
                        label: restResponse[i],
                        id: -1,
                        count: 'N/A' // TODO: include count when backend has it.
                    })
                }
            }

            filters.push(filterObject);
        }
    }
})();
'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:SocketService
 *
 * @description
 * Handles socket connection and communication with the server
 *
 */
angular.module('ilWebClient').factory('SocketService', ['SOCKET_URL', '$window', 'Restangular', '$q', 'SOCKET_TOPICS', function (SOCKET_URL, $window, Restangular, $q, SOCKET_TOPICS) {

    /**
     * Flag that indicates if a socket connection is active or not
     * @type {boolean}
     */
    var isConnectionOpen = false;

    /**
     * Object representing the SockJS client, with all its methods and properties
     * found at: https://github.com/sockjs/sockjs-client
     * @type {object}
     */
    var sock = {};

    /**
     * Object representing the Stomp client
     * @type {object}
     */
    var stompClient = {};

    /**
     * Object holding active channels (used to close them if needed)
     * @type {{}}
     */
    var subscriptionChannels = {};

    /**
     * Object holding arrays of subscribers for each topic
     * @type {{}}
     */
    var subscribersObject = {};

    /**
     * @ngdoc method
     * @name buildChannelsObj
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Builds object to hold channels
     */
    function buildChannelsObj() {
        for (var property in SOCKET_TOPICS) {
            if (SOCKET_TOPICS.hasOwnProperty(property)) {
                subscriptionChannels[SOCKET_TOPICS[property]] = {};
            }
        }
    }

    /**
     * @ngdoc method
     * @name buildSubObject
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Builds object to hold subscriptions
     */
    function buildSubObject() {
        for (var property in SOCKET_TOPICS) {
            if (SOCKET_TOPICS.hasOwnProperty(property)) {
                subscribersObject[SOCKET_TOPICS[property]] = [];
            }
        }
    }

    /**
     * @ngdoc method
     * @name connectWhenLoggedIn
     * @methodOf ilWebClient.service:SocketService
     * @description
     * On refresh/reload if the user has a token, reconnects him.
     */
    function connectWhenLoggedIn() {
        if (isConnectionOpen) {
            return;
        }

        var localStoredToken = $window.localStorage.getItem('token');
        if (localStoredToken) {
            connectToServer();
        }
    }

    /**
     * @ngdoc method
     * @name connectToServer
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Connect to server by instantiating SockJs and Stomp clients, and reaching the server
     */
    function connectToServer() {
        if (isConnectionOpen) {
            return;
        }
        var token = $window.localStorage.getItem('token');
        sock = new SockJS(SOCKET_URL);
        stompClient = Stomp.over(sock);
        stompClient.debug = false;
        stompClient.connect({}, onConnectionSuccess, onConnectionError);
    }

    /**
     * @ngdoc method
     * @name disconnect
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Socket disconnect method
     */
    function disconnect() {
        if (!isConnectionOpen) {
            return;
        }
        stompClient.disconnect(function () {
            isConnectionOpen = false;
        })
    }

    /**
     * @ngdoc method
     * @name onConnectionSuccess
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Connected to server successfully
     */
    function onConnectionSuccess(frame) {
        isConnectionOpen = true;
    }

    /**
     * @ngdoc method
     * @name onConnectionError
     * @methodOf ilWebClient.service:SocketService
     * @description
     * An error occurred while connecting to the server
     */
    function onConnectionError(error) {
        isConnectionOpen = false;
        setTimeout(connectToServer, 10000);
    }

    /**
     * @ngdoc method
     * @name subscribeToTopic
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Subscription to a topic, with the option to pass array updates one entity at a time
     *
     * @param {string}  topic           Topic to subscribe to
     * @param {bool}    runSequential   Should updates coming in as arrays be sent to subscribers item by item?
     */
    function subscribeToTopic(topic, runSequential) {
        var endpoint = topic + $window.localStorage.getItem('tenantID') + '/';
        subscriptionChannels[topic] = stompClient.subscribe(endpoint, function (update) {
            notifySubscribers(subscribersObject[topic], JSON.parse(update.body), runSequential);
        });
    }

    /**
     * @ngdoc method
     * @name subscribeToTopic
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Close a topic with the server
     *
     * @param {string} topic Topic to close
     */
    function closeTopicSubscription(topic) {
        if (subscribersObject[topic].length == 0) {
            if (subscriptionChannels[topic].hasOwnProperty('unsubscribe')){
                subscriptionChannels[topic].unsubscribe();
            }
        }
    }

    /**
     * @ngdoc method
     * @name registerWatcher
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Subscribes the caller to a socket event
     *
     * @param {string}  topic               Topic to watch
     * @param {object}  subscriptionObj     Object containing source (unique string), callback (to call on updates) and runSequential
     */
    function registerWatcher(topic, subscriptionObj) {
        if (!isConnectionOpen) {
            return;
        }
        if (subscribersObject[topic].length > 0) {
            unregisterWatcher(topic, subscriptionObj.source);
        }
        subscribersObject[topic].push(subscriptionObj);
        if (subscribersObject[topic].length == 1) {
            subscribeToTopic(topic, subscriptionObj.runSequential);
        }
    }

    /**
     * @ngdoc method
     * @name unregisterWatcher
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Unsubscribes the caller from a socket event
     *
     * @param {string}  topic   Topic to unregister watch from
     * @param {string}  source  Controller name from which call is made
     */
    function unregisterWatcher(topic, source) {
        for (var i = 0; i < subscribersObject[topic].length; i++) {
            if (subscribersObject[topic][i].source === source) {
                subscribersObject[topic].splice(i, 1);
            }
        }
        closeTopicSubscription(topic);
    }

    /**
     * @ngdoc method
     * @name isConnected
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Indicates if the socket is connected
     *
     * @returns {boolean}   Is the socket connection open or not
     */
    function isConnected() {
        return isConnectionOpen;
    }

    /**
     * @ngdoc method
     * @name notifySubscribers
     * @methodOf ilWebClient.service:SocketService
     * @description
     * Notify an array of subscribers for a specific topic of a new updated object/array of objects
     *
     * @param {Array} subscriberArray   Array of subscribers to be notified
     * @param {object} updateObject     Object representing the update via sockets
     * @param {bool} runSequential      Boolean, indicate if an update which is an array should send separate notifications for each item, or send the entire array
     * @returns {boolean}               Is the socket connection open or not
     */
    function notifySubscribers(subscriberArray, updateObject, runSequential) {
        angular.forEach(subscriberArray, function (subscriptionObj) {
            if (updateObject.length && runSequential) {
                updateObject.forEach(function (item) {
                    subscriptionObj.callback(item);
                });
            } else if (updateObject.length && !runSequential) {
                subscriptionObj.callback(updateObject);
            } else {
                subscriptionObj.callback(updateObject);
            }
        })
    }

    buildChannelsObj(); // channel objects dynamically built in 'subscriptionChannels'
    buildSubObject(); // watcher arrays dynamically built in 'subscribersObject'
    connectWhenLoggedIn();

    return {
        connect: connectToServer,
        disconnect: disconnect,
        isConnected: isConnected,
        registerWatcher: registerWatcher,
        unregisterWatcher: unregisterWatcher
    };

}]);

// Generated by CoffeeScript 1.7.1

/*
   Stomp Over WebSocket http://www.jmesnil.net/stomp-websocket/doc/ | Apache License V2.0

   Copyright (C) 2010-2013 [Jeff Mesnil](http://jmesnil.net/)
   Copyright (C) 2012 [FuseSource, Inc.](http://fusesource.com)
 */

(function() {
  var Byte, Client, Frame, Stomp,
    __hasProp = {}.hasOwnProperty,
    __slice = [].slice;

  Byte = {
    LF: '\x0A',
    NULL: '\x00'
  };

  Frame = (function() {
    var unmarshallSingle;

    function Frame(command, headers, body) {
      this.command = command;
      this.headers = headers != null ? headers : {};
      this.body = body != null ? body : '';
    }

    Frame.prototype.toString = function() {
      var lines, name, value, _ref;
      lines = [this.command];
      _ref = this.headers;
      for (name in _ref) {
        if (!__hasProp.call(_ref, name)) continue;
        value = _ref[name];
        lines.push("" + name + ":" + value);
      }
      if (this.body) {
        lines.push("content-length:" + (Frame.sizeOfUTF8(this.body)));
      }
      lines.push(Byte.LF + this.body);
      return lines.join(Byte.LF);
    };

    Frame.sizeOfUTF8 = function(s) {
      if (s) {
        return encodeURI(s).split(/%..|./).length - 1;
      } else {
        return 0;
      }
    };

    unmarshallSingle = function(data) {
      var body, chr, command, divider, headerLines, headers, i, idx, len, line, start, trim, _i, _j, _len, _ref, _ref1;
      divider = data.search(RegExp("" + Byte.LF + Byte.LF));
      headerLines = data.substring(0, divider).split(Byte.LF);
      command = headerLines.shift();
      headers = {};
      trim = function(str) {
        return str.replace(/^\s+|\s+$/g, '');
      };
      _ref = headerLines.reverse();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        idx = line.indexOf(':');
        headers[trim(line.substring(0, idx))] = trim(line.substring(idx + 1));
      }
      body = '';
      start = divider + 2;
      if (headers['content-length']) {
        len = parseInt(headers['content-length']);
        body = ('' + data).substring(start, start + len);
      } else {
        chr = null;
        for (i = _j = start, _ref1 = data.length; start <= _ref1 ? _j < _ref1 : _j > _ref1; i = start <= _ref1 ? ++_j : --_j) {
          chr = data.charAt(i);
          if (chr === Byte.NULL) {
            break;
          }
          body += chr;
        }
      }
      return new Frame(command, headers, body);
    };

    Frame.unmarshall = function(datas) {
      var data;
      return (function() {
        var _i, _len, _ref, _results;
        _ref = datas.split(RegExp("" + Byte.NULL + Byte.LF + "*"));
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          data = _ref[_i];
          if ((data != null ? data.length : void 0) > 0) {
            _results.push(unmarshallSingle(data));
          }
        }
        return _results;
      })();
    };

    Frame.marshall = function(command, headers, body) {
      var frame;
      frame = new Frame(command, headers, body);
      return frame.toString() + Byte.NULL;
    };

    return Frame;

  })();

  Client = (function() {
    var now;

    function Client(ws) {
      this.ws = ws;
      this.ws.binaryType = "arraybuffer";
      this.counter = 0;
      this.connected = false;
      this.heartbeat = {
        outgoing: 10000,
        incoming: 10000
      };
      this.maxWebSocketFrameSize = 16 * 1024;
      this.subscriptions = {};
    }

    Client.prototype.debug = function(message) {
      var _ref;
      return typeof window !== "undefined" && window !== null ? (_ref = window.console) != null ? _ref.log(message) : void 0 : void 0;
    };

    now = function() {
      return Date.now || new Date().valueOf;
    };

    Client.prototype._transmit = function(command, headers, body) {
      var out;
      out = Frame.marshall(command, headers, body);
      if (typeof this.debug === "function") {
        this.debug(">>> " + out);
      }
      while (true) {
        if (out.length > this.maxWebSocketFrameSize) {
          this.ws.send(out.substring(0, this.maxWebSocketFrameSize));
          out = out.substring(this.maxWebSocketFrameSize);
          if (typeof this.debug === "function") {
            this.debug("remaining = " + out.length);
          }
        } else {
          return this.ws.send(out);
        }
      }
    };

    Client.prototype._setupHeartbeat = function(headers) {
      var serverIncoming, serverOutgoing, ttl, v, _ref, _ref1;
      if ((_ref = headers.version) !== Stomp.VERSIONS.V1_1 && _ref !== Stomp.VERSIONS.V1_2) {
        return;
      }
      _ref1 = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = headers['heart-beat'].split(",");
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          v = _ref1[_i];
          _results.push(parseInt(v));
        }
        return _results;
      })(), serverOutgoing = _ref1[0], serverIncoming = _ref1[1];
      if (!(this.heartbeat.outgoing === 0 || serverIncoming === 0)) {
        ttl = Math.max(this.heartbeat.outgoing, serverIncoming);
        if (typeof this.debug === "function") {
          this.debug("send PING every " + ttl + "ms");
        }
        this.pinger = Stomp.setInterval(ttl, (function(_this) {
          return function() {
            _this.ws.send(Byte.LF);
            return typeof _this.debug === "function" ? _this.debug(">>> PING") : void 0;
          };
        })(this));
      }
      if (!(this.heartbeat.incoming === 0 || serverOutgoing === 0)) {
        ttl = Math.max(this.heartbeat.incoming, serverOutgoing);
        if (typeof this.debug === "function") {
          this.debug("check PONG every " + ttl + "ms");
        }
        return this.ponger = Stomp.setInterval(ttl, (function(_this) {
          return function() {
            var delta;
            delta = now() - _this.serverActivity;
            if (delta > ttl * 2) {
              if (typeof _this.debug === "function") {
                _this.debug("did not receive server activity for the last " + delta + "ms");
              }
              return _this.ws.close();
            }
          };
        })(this));
      }
    };

    Client.prototype._parseConnect = function() {
      var args, connectCallback, errorCallback, headers;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      headers = {};
      switch (args.length) {
        case 2:
          headers = args[0], connectCallback = args[1];
          break;
        case 3:
          if (args[1] instanceof Function) {
            headers = args[0], connectCallback = args[1], errorCallback = args[2];
          } else {
            headers.login = args[0], headers.passcode = args[1], connectCallback = args[2];
          }
          break;
        case 4:
          headers.login = args[0], headers.passcode = args[1], connectCallback = args[2], errorCallback = args[3];
          break;
        default:
          headers.login = args[0], headers.passcode = args[1], connectCallback = args[2], errorCallback = args[3], headers.host = args[4];
      }
      return [headers, connectCallback, errorCallback];
    };

    Client.prototype.connect = function() {
      var args, errorCallback, headers, out;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      out = this._parseConnect.apply(this, args);
      headers = out[0], this.connectCallback = out[1], errorCallback = out[2];
      if (typeof this.debug === "function") {
        this.debug("Opening Web Socket...");
      }
      this.ws.onmessage = (function(_this) {
        return function(evt) {
          var arr, c, client, data, frame, messageID, onreceive, subscription, _i, _len, _ref, _results;
          data = typeof ArrayBuffer !== 'undefined' && evt.data instanceof ArrayBuffer ? (arr = new Uint8Array(evt.data), typeof _this.debug === "function" ? _this.debug("--- got data length: " + arr.length) : void 0, ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = arr.length; _i < _len; _i++) {
              c = arr[_i];
              _results.push(String.fromCharCode(c));
            }
            return _results;
          })()).join('')) : evt.data;
          _this.serverActivity = now();
          if (data === Byte.LF) {
            if (typeof _this.debug === "function") {
              _this.debug("<<< PONG");
            }
            return;
          }
          if (typeof _this.debug === "function") {
            _this.debug("<<< " + data);
          }
          _ref = Frame.unmarshall(data);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            frame = _ref[_i];
            switch (frame.command) {
              case "CONNECTED":
                if (typeof _this.debug === "function") {
                  _this.debug("connected to server " + frame.headers.server);
                }
                _this.connected = true;
                _this._setupHeartbeat(frame.headers);
                _results.push(typeof _this.connectCallback === "function" ? _this.connectCallback(frame) : void 0);
                break;
              case "MESSAGE":
                subscription = frame.headers.subscription;
                onreceive = _this.subscriptions[subscription] || _this.onreceive;
                if (onreceive) {
                  client = _this;
                  messageID = frame.headers["message-id"];
                  frame.ack = function(headers) {
                    if (headers == null) {
                      headers = {};
                    }
                    return client.ack(messageID, subscription, headers);
                  };
                  frame.nack = function(headers) {
                    if (headers == null) {
                      headers = {};
                    }
                    return client.nack(messageID, subscription, headers);
                  };
                  _results.push(onreceive(frame));
                } else {
                  _results.push(typeof _this.debug === "function" ? _this.debug("Unhandled received MESSAGE: " + frame) : void 0);
                }
                break;
              case "RECEIPT":
                _results.push(typeof _this.onreceipt === "function" ? _this.onreceipt(frame) : void 0);
                break;
              case "ERROR":
                _results.push(typeof errorCallback === "function" ? errorCallback(frame) : void 0);
                break;
              default:
                _results.push(typeof _this.debug === "function" ? _this.debug("Unhandled frame: " + frame) : void 0);
            }
          }
          return _results;
        };
      })(this);
      this.ws.onclose = (function(_this) {
        return function() {
          var msg;
          msg = "Whoops! Lost connection to " + _this.ws.url;
          if (typeof _this.debug === "function") {
            _this.debug(msg);
          }
          _this._cleanUp();
          return typeof errorCallback === "function" ? errorCallback(msg) : void 0;
        };
      })(this);
      return this.ws.onopen = (function(_this) {
        return function() {
          if (typeof _this.debug === "function") {
            _this.debug('Web Socket Opened...');
          }
          headers["accept-version"] = Stomp.VERSIONS.supportedVersions();
          headers["heart-beat"] = [_this.heartbeat.outgoing, _this.heartbeat.incoming].join(',');
          return _this._transmit("CONNECT", headers);
        };
      })(this);
    };

    Client.prototype.disconnect = function(disconnectCallback) {
      this._transmit("DISCONNECT");
      this.ws.onclose = null;
      this.ws.close();
      this._cleanUp();
      return typeof disconnectCallback === "function" ? disconnectCallback() : void 0;
    };

    Client.prototype._cleanUp = function() {
      this.connected = false;
      if (this.pinger) {
        Stomp.clearInterval(this.pinger);
      }
      if (this.ponger) {
        return Stomp.clearInterval(this.ponger);
      }
    };

    Client.prototype.send = function(destination, headers, body) {
      if (headers == null) {
        headers = {};
      }
      if (body == null) {
        body = '';
      }
      headers.destination = destination;
      return this._transmit("SEND", headers, body);
    };

    Client.prototype.subscribe = function(destination, callback, headers) {
      var client;
      if (headers == null) {
        headers = {};
      }
      if (!headers.id) {
        headers.id = "sub-" + this.counter++;
      }
      headers.destination = destination;
      this.subscriptions[headers.id] = callback;
      this._transmit("SUBSCRIBE", headers);
      client = this;
      return {
        id: headers.id,
        unsubscribe: function() {
          return client.unsubscribe(headers.id);
        }
      };
    };

    Client.prototype.unsubscribe = function(id) {
      delete this.subscriptions[id];
      return this._transmit("UNSUBSCRIBE", {
        id: id
      });
    };

    Client.prototype.begin = function(transaction) {
      var client, txid;
      txid = transaction || "tx-" + this.counter++;
      this._transmit("BEGIN", {
        transaction: txid
      });
      client = this;
      return {
        id: txid,
        commit: function() {
          return client.commit(txid);
        },
        abort: function() {
          return client.abort(txid);
        }
      };
    };

    Client.prototype.commit = function(transaction) {
      return this._transmit("COMMIT", {
        transaction: transaction
      });
    };

    Client.prototype.abort = function(transaction) {
      return this._transmit("ABORT", {
        transaction: transaction
      });
    };

    Client.prototype.ack = function(messageID, subscription, headers) {
      if (headers == null) {
        headers = {};
      }
      headers["message-id"] = messageID;
      headers.subscription = subscription;
      return this._transmit("ACK", headers);
    };

    Client.prototype.nack = function(messageID, subscription, headers) {
      if (headers == null) {
        headers = {};
      }
      headers["message-id"] = messageID;
      headers.subscription = subscription;
      return this._transmit("NACK", headers);
    };

    return Client;

  })();

  Stomp = {
    VERSIONS: {
      V1_0: '1.0',
      V1_1: '1.1',
      V1_2: '1.2',
      supportedVersions: function() {
        return '1.1,1.0';
      }
    },
    client: function(url, protocols) {
      var klass, ws;
      if (protocols == null) {
        protocols = ['v10.stomp', 'v11.stomp'];
      }
      klass = Stomp.WebSocketClass || WebSocket;
      ws = new klass(url, protocols);
      return new Client(ws);
    },
    over: function(ws) {
      return new Client(ws);
    },
    Frame: Frame
  };

  if (typeof window !== "undefined" && window !== null) {
    Stomp.setInterval = function(interval, f) {
      return window.setInterval(f, interval);
    };
    Stomp.clearInterval = function(id) {
      return window.clearInterval(id);
    };
    window.Stomp = Stomp;
  } else if (typeof exports !== "undefined" && exports !== null) {
    exports.Stomp = Stomp;
  } else {
    self.Stomp = Stomp;
  }

}).call(this);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:SurveyController
 * @description
 * Handles survey results view
 */
angular.module('ilWebClient').controller('SurveyController', ['$scope', 'CrudFactory', 'UserService', '$mdDialog', 'UtilService', 'SurveyService', 'NotificationService', '$window', 'API_URL', '$q', 'HospitalThemeService',
    function ($scope, CrudFactory, UserService, $mdDialog, UtilService, SurveyService, NotificationService, $window, API_URL, $q, HospitalThemeService) {
        var SURVEY_ERROR_MSG = 'This Hospital already has a survey associated. Please edit the existing survey.';
        $scope.ROLES = UserService.getRoles();
        $scope.preActionHook = preActionHook;
        $scope.reloadSurveys = reloadSurveys;
        $scope.loadSurveyResults = loadSurveyResults;
        $scope.resetFilter = resetFilter;
        $scope.onPaginate = onPaginate;
        $scope.cannotDeleteItem = cannotDeleteItem;
        $scope.surveyQuestions = [];
        $scope.surveyResults = [];
        $scope.type = 'crud';
        $scope.formOptions = {};
        $scope.filter = {};
        $scope.page = 1;
        $scope.limit = 10;
        $scope.hospitalHasSurvey = false;
        $scope.theme = null;
        $scope.columns = {
            'name': {
                'name': 'Survey Name',
                'orderBy': 'name'
            },
            'description': {
                'name': 'Description'
            },
            'status': {
                'name': 'Status'
            }
        };

        HospitalThemeService
            .loadTheme()
            .then(function(theme){
                $scope.theme = theme;
            })
            .catch(function(err){
                // TODO: handle error in loading theme
            });

        /**
         * Check if we have an active survey in our list.
         * @throws Error - if an active survey already exists in our list
         * @return Promise
         */
        function checkForActiveSurvey() {
            var restService = new CrudFactory.CrudRest('survey');
            return restService.list().then(function(result) {
                if (result[0] && containsActiveItem(result)) {
                    return $q.reject(SURVEY_ERROR_MSG);
                }
                return;
            })
        }

        function containsActiveItem(array) {
            var contains = false;
            array.forEach(function(item) {
                if (!item.isDeleted) {
                    return contains = true;
                }
            });
            return contains;
        }

        $scope.actions = [{
            title: 'Download Results',
            action: 'start',
            icon: {
                'zmdi-download': true
            },
            color: 'green',
            callback: downloadReport,
            shouldBeHidden: function() {return false;}
        }];


        function updateSurveysList(hospitalId) {
            var surveyRestService = new CrudFactory.CrudRest('survey');
            surveyRestService.list({hospital: hospitalId}).then(function (surveyList) {
                $scope.formOptions.surveys = surveyList;
            });
        }

        $scope.$on('crud.created.survey', function () {
            reloadSurveys();
        });

        function preActionHook(room, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    handleSurveyDeletion(room, resolve, reject);
                    break;
                case 'create':
                    checkForActiveSurvey().then(function () {
                        resolve(room);
                    }, function (errorMessage) {
                        NotificationService.show(errorMessage, 'error');
                    })
                    break;
                default:
                    resolve(room);
            }
        }

        function handleSurveyDeletion(survey, resolve, reject) {
            if (survey.isActive) {
                var options = {
                    title: 'Remove active survey',
                    body: 'You cannot remove a survey that is currently in use.'
                };
                UtilService.openAlertModal(options);
            } else {
                resolve([survey, 'survey']);
            }
        }

        function cannotDeleteItem(survey) {
            return survey.isActive;
        }

        function reloadSurveys(hospital) {
            $scope.surveyQuestions = [];
            $scope.surveyResults = [];
            delete $scope.filter.survey;
            updateSurveysList(hospital);
        }

        function loadSurveyResults(filter) {
            filter.page = $scope.page;
            filter.limit = $scope.limit;

            var surveyResultsRestService = new CrudFactory.CrudRest('survey/response/');
            surveyResultsRestService.list(filter).then(function (surveyResults) {
                $scope.surveyQuestions = surveyResults[0];
                $scope.surveyResults = surveyResults.splice(1, surveyResults.length - 1);
            });
        }

        function resetFilter() {
            $scope.filter = {};
            $scope.surveyQuestions = [];
            $scope.surveyResults = [];
        }

        function onPaginate() {
            //TODO: handle pagination on survey answers
        }

        function downloadReport(survey) {
            SurveyService
                .download(survey)
                .then(function(result) {
                    location.href = API_URL + '/survey/response/report?reportFormat=csv&survey=' + survey.id;
                })
                .catch(function(error){
                    UtilService.showErrorNotification(error, 'Something went wrong! Please try again');
                });
        }

        reloadSurveys();

    }]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:SurveyService
 *
 * @description
 * Helper service for handling survey-related actions
 *
 */
angular.module('ilWebClient').service('SurveyService', ['Restangular', function (Restangular) {
    this.service = Restangular.service('survey/');
    var self = this;

    /**
     * @ngdoc method
     * @name activate
     * @methodOf ilWebClient.service:SurveyService
     * @description
     * Activate an existing survey
     *
     * @param {object}  survey      Survey object
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function activate(survey) {
        return self.service.one().customGET(survey.id + '/activate');
    }

    /**
     * @ngdoc method
     * @name deactivate
     * @methodOf ilWebClient.service:SurveyService
     * @description
     * Deactivate an existing survey
     *
     * @param {object}  survey      Survey object
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function deactivate(survey) {
        return self.service.one().customGET(survey.id + '/deactivate');
    }

    /**
     * @ngdoc method
     * @name download
     * @methodOf ilWebClient.service:SurveyService
     * @description
     * Download an existing survey
     *
     * @param {object}  survey      Survey object
     *
     * @returns {object}            Promise that resolves into data from server
     */
    function download(survey) {
        return self.service.one().customGET('response/report', {
            reportFormat: 'csv',
            survey: survey.id
        });
    }

    return {
        activate: activate,
        deactivate: deactivate,
        download: download
    }

}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:RoleChangeController
 * @description
 * Handles role changing for users
 */
angular.module('ilWebClient').controller('RoleChangeController', ['$scope', '$mdDialog', 'userIds', 'UserActionsService', 'CrudFactory', 'NotificationService', 'AutocompleteHelperService',
    function ($scope, $mdDialog, userIds, UserActionsService, CrudFactory, NotificationService, AutocompleteHelperService) {
        $scope.close = $mdDialog.cancel;
        $scope.save = save;
        $scope.roles = [];
        $scope.role = null;
        $scope.searchText = '';
        $scope.querySearch = querySearch;

        function save() {
            UserActionsService
                .bulkUpdateRole(userIds, $scope.role)
                .then(function (success) {
                    $mdDialog.hide($scope.model);
                    NotificationService.show('Users updated', 'success');
                }, function (fail) {
                    NotificationService.show(fail.userFriendlyMessage || 'Error! Please try again', 'error');
                })
        }

        function getRoles() {
            new CrudFactory.CrudRest('role').list().then(function (rolesList) {
                $scope.roles = rolesList;
            });
        }

        function querySearch(search) {
            var result = AutocompleteHelperService.filter($scope.searchText, $scope.roles, 'name');
            return AutocompleteHelperService.querySearch(null, null, result);
        }

        getRoles();
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:UserController
 * @description
 * User CRUD controller
 */
angular.module('ilWebClient').controller('UserController', ['$scope', 'CrudFactory', 'UserActionsService', 'UserService', '$mdDialog', 'NotificationService', 'UtilService', '$window',
    function ($scope, CrudFactory, UserActionsService, UserService, $mdDialog, NotificationService, UtilService, $window) {

        $scope.ROLES = UserService.getRoles();
        $scope.PERMISSIONS = UserService.getHospitalPermissions();
        $scope.preActionHook = preActionHook;
        $scope.cannotDeleteItem = cannotDeleteItem;

        var selectedUserIds = [];

        $scope.columns = {
            'firstName': {
                'name': 'First Name',
                'orderBy': 'firstName'
            },
            'lastName': {
                'name': 'Last Name',
                'orderBy': 'lastName'
            },
            'email': {
                'name': 'Email'
            },
            'role': {
                'name': 'Role',
                'displayProperty': 'name'
            },
            'status': {
                'name': 'Status'
            }
        };

        $scope.buttons = [
            {
                name: 'Send activation email',
                confirmation: openConfirmationModal,
                callback: bulkSendActivationEmail,
                isEnabled: userSelectionsExist,
                textColor: '#75A6CF',
                bgColor: '#ffffff',
                options: {
                    title: 'Send activation email',
                    body: 'Only inactive users will receive an activation email.'
                }
            },
            {
                name: 'Update user role',
                confirmation: openRoleChangeModal,
                isEnabled: userSelectionsExist,
                textColor: '#75A6CF',
                bgColor: '#ffffff'
            }
        ];

        $scope.userselect = {
            name: 'Select',
            onChange: function (item) {
                toggleUserSelection(item.id);
            }
        };

        $scope.actions = [
            {
                title: 'Unlock',
                action: 'start',
                icon: {
                    'zmdi-lock-open': true
                },
                color: '#75A6CF',
                callback: unlockUser,
                shouldBeHidden: disableUserUnlocking
            },
            {
                title: 'Activate',
                action: 'start',
                icon: {
                    'zmdi-check-circle': true
                },
                color: 'green',
                callback: setUserActiveStatus,
                shouldBeHidden: disableUserActivation
            },
            {
                title: 'Deactivate',
                action: 'start',
                icon: {
                    'zmdi-close-circle': true
                },
                color: 'red',
                callback: setUserInactiveStatus,
                shouldBeHidden: disableUserDeactivation
            }
        ];

        $scope.filterConfig = {
            role: {
                type: 'select',
                column: 'role',
                placeholder: 'by Role',
                allowMultipleSelection: true,
                values: []
            },
            'status': {
                type: 'select',
                column: 'status',
                placeholder: 'by Status',
                allowMultipleSelection: true,
                values: [
                    {
                        name: 'ACTIVE'.toUpperCase(),
                        value: 'ACTIVE'.toUpperCase()
                    },
                    {
                        name: 'INACTIVE'.toUpperCase(),
                        value: 'INACTIVE'.toUpperCase()
                    },
                    {
                        name: 'LOCKED'.toUpperCase(),
                        value: 'LOCKED'.toUpperCase()
                    }
                ]
            }
        };

        $scope.formOptions = {
            users: [],
            roles: [],
            positions: [],
            specialisations: []
        };


        $scope.$on('crud.toggledItems.user', function (e, userIds) {
            selectedUserIds = userIds;
        });

        function disableUserActivation(user) {
            return user.isActive || !user.hasPasswordSet;
        }

        function disableUserDeactivation(user) {
            var localUser = JSON.parse($window.localStorage.getItem('user'));
            return !user.isActive || localUser.id === user.id;
        }

        function disableUserUnlocking(user) {
            return !user.isBlocked;
        }

        function toggleUserSelection(userId) {
            var id = selectedUserIds.indexOf(userId);
            if (id > -1) {
                selectedUserIds.splice(id, 1);
            } else {
                selectedUserIds.push(userId);
            }
        }

        function userSelectionsExist() {
            return selectedUserIds.length > 0;
        }

        function setUserActiveStatus(user) {
            var options = {
                title: 'Activate user',
                body: 'Are you sure you want to activate this user?'
            };
            openConfirmationModal(options, function () {
                UserActionsService
                    .setActiveStatus(user, true)
                    .then(updateUserActivated)
                    .catch(function (error) {
                        NotificationService.show('Error! Please try again', 'error');
                    });
            })
        }

        function setUserInactiveStatus(user) {
            UserService
                .getCurrentUser()
                .then(function (result) {
                    if (user.id == result.id) {
                        var options = {
                            title: 'Deactivate user',
                            body: 'You cannot deactivate your own account. Please contact the support team.'
                        };
                        UtilService.openAlertModal(options);
                    } else {
                        requestToSetUserInactive(user);
                    }
                })
                .catch(function (error) {
                    NotificationService.show('Error! Please try again', 'error');
                });


        }

        function requestToSetUserInactive(user) {
            var options = {
                title: 'Deactivate user',
                body: 'Are you sure you want to deactivate this user?'
            };
            openConfirmationModal(options, function () {
                UserActionsService
                    .setActiveStatus(user, false)
                    .then(updateUserDeactivated)
                    .catch(function (error) {
                        NotificationService.show('Error! Please try again', 'error');
                    });
            })
        }

        function unlockUser(user) {
            var options = {
                title: 'Unlock user',
                body: 'Are you sure you want to unlock this user?'
            };
            openConfirmationModal(options, function () {
                UserActionsService.unlockUser(user)
                    .then(updateUserUnlocked)
                    .catch(function (error) {
                        NotificationService.show('Error! Please try again', 'error');
                    });
            })
        }

        function openRoleChangeModal() {
            $mdDialog.show({
                    templateUrl: 'js/user/role-change.html',
                    controller: 'RoleChangeController',
                    parent: angular.element(document.body),
                    locals: {
                        userIds: selectedUserIds
                    },
                    bindToController: true,
                    escapeToClose: false,
                    fullscreen: true
                })
                .then(function (result) {
                    // TODO: process result if needed
                    updateUserList('updated');
                    selectedUserIds = [];
                }, function () {
                    //TODO: any cleanup after cancel
                });
        }

        function openConfirmationModal(options, callback) {
            var confirmDialog = $mdDialog.confirm()
                .title(options.title)
                .htmlContent('\<span class="modal-custom-body">' + options.body + '\</span>')
                .ariaLabel('Confirm')
                .ok('OK')
                .cancel('Cancel');
            $mdDialog.show(confirmDialog).then(function () {
                if (typeof callback === 'function') {
                    callback();
                }
            });
        }

        function bulkSendActivationEmail() {
            UserActionsService
                .bulkSendActivationEmail(selectedUserIds)
                .then(function (result) {
                    updateUserList('invited');
                    selectedUserIds = [];
                })
                .catch(function (error) {
                    NotificationService.show(error.userFriendlyMessage || 'Error! Please try again', 'error');
                });
        }

        function updateUserList(action) {
            if (action && typeof action === "string") {
                NotificationService.show('User ' + action, 'success');
            }
            $scope.$broadcast('crud.reload.user');
        }

        function updateUserActivated(user) {
            updateUser(user, 'activated', true);
        }

        function updateUserDeactivated(user) {
            updateUser(user, 'deactivated', true);
        }

        function updateUserUnlocked(user) {
            updateUser(user, 'unlocked', true);
        }

        function updateUser(user, action, reloadAll) {
            if (action && typeof action === "string") {
                NotificationService.show('User ' + action, 'success');
            }
            if (reloadAll) {
                updateUserList();
            } else {
                $scope.$broadcast('crud.updated.user', user);
            }
        }

        function updateRolesList() {
            var rolesRestService = new CrudFactory.CrudRest('role');
            rolesRestService.list().then(function (rolesList) {
                var tmp = [];
                for (var i = 0; i < rolesList.length; i++) {
                    tmp.push({
                        name: rolesList[i].name,
                        value: rolesList[i].id
                    });
                }
                $scope.formOptions.roles = rolesList;
                $scope.filterConfig.role.values = tmp;
            });
        }

        function updatePositionsList(filter) {
            if (!$scope.PERMISSIONS || $scope.PERMISSIONS.ptrak) {
                var hospitalRestService = new CrudFactory.CrudRest('dictionary/POSITION');
                hospitalRestService.get(filter).then(function (positions) {
                    $scope.formOptions.positions = positions.values;
                });
            }
        }

        function updateSpecialisationsList(filter) {
            if (!$scope.PERMISSIONS || $scope.PERMISSIONS.ptrak) {
                var hospitalRestService = new CrudFactory.CrudRest('dictionary/SPECIALIZATION');
                hospitalRestService.get(filter).then(function (specialisations) {
                    $scope.formOptions.specialisations = specialisations.values;
                });
            }
        }

        function preActionHook(user, actionName, resolve, reject) {
            switch (actionName) {
                case 'delete':
                    handleUserDeletion(user, resolve, reject);
                    break;
                case 'create':
                    resolve(user);
                    break;
                case 'edit' :
                    if (user.hospital) {
                        updatePositionsList({hospital: user.hospital.id});
                        updateSpecialisationsList({hospital: user.hospital.id});
                    }
                    resolve(user);
                    break;
                default:
                    resolve(user);
            }
        }

        function handleUserDeletion(user, resolve, reject) {
            UserService
                .getCurrentUser()
                .then(function (result) {
                    if (user.id == result.id) {
                        var options = {
                            title: 'Remove own account',
                            body: 'You cannot remove your own account. Please contact the support team.'
                        };
                        UtilService.openAlertModal(options);
                    } else {
                        resolve([user, 'user', 'The user will no longer be able to access the system']);
                    }
                })
                .catch(function (error) {
                    NotificationService.show('Something went wrong! Please try again', 'error');
                });
        }

        function cannotDeleteItem(user) {
            var localUser = JSON.parse($window.localStorage.getItem('user'));
            return user.id == localUser.id;
        }

        updatePositionsList();
        updateSpecialisationsList();
        updateRolesList();
    }]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:UserActionsService
 *
 * @description
 * User helper service for various actions the entity can perform
 *
 */
angular.module('ilWebClient').service('UserActionsService', ['Restangular', function (Restangular) {
    var self = this;
    self.service = Restangular.service('user');

    var userCRUDServiceAPI = {
        setActiveStatus: setActiveStatus,
        unlockUser: unlockUser,
        bulkUpdateRole: bulkUpdateRole,
        bulkSendActivationEmail: bulkSendActivationEmail,
        sendUserMessage: sendUserMessage
    };


    /**
     * @ngdoc method
     * @name setActiveStatus
     * @methodOf ilWebClient.service:UserActionsService
     * @description
     * Set the active status of an user
     *
     * @param {object}  user        User object
     * @param {string}  status      Status to set on user
     *
     * @returns {object}    Promise that resolves into data from server
     */
    function setActiveStatus(user, status) {
        status = !!status;
        return Restangular.one('user').customPUT({}, user.id + '/status', {isActive: status});
    }


    /**
     * @ngdoc method
     * @name unlockUser
     * @methodOf ilWebClient.service:UserActionsService
     * @description
     * Unlocks a user that was locked by the system
     *
     * @param {object}  user        User object
     *
     * @returns {object}    Promise that resolves into data from server
     */
    function unlockUser(user) {
        return Restangular.one('user').customPUT({}, user.id + '/unblock');
    }


    /**
     * @ngdoc method
     * @name bulkUpdateRole
     * @methodOf ilWebClient.service:UserActionsService
     * @description
     * Updates role for users in bulk
     *
     * @param {Array}  userIds  Array of user IDs to update
     * @param {string}  role    Role to be set on users
     *
     * @returns {object}    Promise that resolves into data from server
     */
    function bulkUpdateRole(userIds, role) {
        return Restangular.one('user').customPUT({ids: userIds, role: role}, '/role/bulk-update');
    }


    /**
     * @ngdoc method
     * @name bulkSendActivationEmail
     * @methodOf ilWebClient.service:UserActionsService
     * @description
     * Send the activation email to multiple users at once
     *
     * @param {Array}  userIds  Array of user IDs to update
     *
     * @returns {object}        Promise that resolves into data from server
     */
    function bulkSendActivationEmail(userIds) {
        return Restangular.one('user').customPOST({ids: userIds}, '/send-invitation');
    }

    
    /**
     * @ngdoc method
     * @name sendUserMessage
     * @methodOf ilWebClient.service:UserActionsService
     * @description
     * Send a message to the user's family (via that user's beacon allocation)
     *
     * @param {number}  allocationId    Allocation ID for  which we want to send a message
     * @param {object}  msgObject       Object containing the 'text' property to be transmitted into a message
     *
     * @returns {object}    Promise that resolves into data from server
     */
    function sendUserMessage(allocationId, msgObject) {
        return Restangular.one('beacon-allocation/notification/').customPOST(msgObject, allocationId.toString());
    }

    return userCRUDServiceAPI;
}]);

'use strict';

/**
 * @ngdoc service
 * @name ilWebClient.service:UserService
 *
 * @description
 * User service that handles tasks login, password and auth - related
 *
 */
angular.module('ilWebClient').service('UserService', ['Restangular', '$q', '$state', '$window', 'ROLES', 'SocketService', '$cookies', 'HospitalThemeService',
function (Restangular, $q, $state, $window, ROLES, SocketService, $cookies, HospitalThemeService) {

    var self = this;
    self.service = Restangular.service('user');
    var _currentUserData = {};

    /**
     * Exposed API for user service
     * @type {object}
     */
    var userServiceAPI = {
        login: login,
        logout: logout,
        setCurrentUser: setCurrentUser,
        getCurrentUser: getCurrentUser,
        requestPasswordReset: requestPasswordReset,
        setNewPassword: setNewPassword,
        isAuthenticated: isAuthenticated,
        hasRole: hasRole,
        getRoles: getRoles,
        getHospitalPermissions: getHospitalPermissions,
        getRolesArray: getRolesArray,
        checkEmailToken: checkEmailToken,
        invalidateToken: invalidateToken,
        getStoreIosURL: getStoreIosURL,
        getStoreAndroidURL: getStoreAndroidURL
    };


    /**
     * @ngdoc method
     * @name init
     * @methodOf ilWebClient.service:UserService
     * @description
     * Load user data from local storage upon refresh
     */
    function init() {
        var localStoredUser = $window.localStorage.getItem('user');
        if (localStoredUser) {
            _currentUserData = JSON.parse(localStoredUser);
        }
    }

    init();


    /**
     * @ngdoc method
     * @name login
     * @methodOf ilWebClient.service:UserService
     * @description
     * Performs login for user with credentials
     *
     * @param {object}  credentials     Object containing email and password
     *
     * @returns {object}    Promise that resolves into data from server
     */
    function login(credentials) {
        return Restangular.one('user').customPOST({email: credentials.email, password: credentials.password}, 'login');
    }


    /**
     * @ngdoc method
     * @name logout
     * @methodOf ilWebClient.service:UserActionsService
     * @description
     * Performs logout for user and does cleanup
     */
    function logout() {
        SocketService.disconnect();
        HospitalThemeService.clearTheme();
        $window.localStorage.clear();
        $cookies.remove('security-cookie');
        _currentUserData = {};
        $state.transitionTo('login');
    }


    /**
     * @ngdoc method
     * @name requestPasswordReset
     * @methodOf ilWebClient.service:UserService
     * @description
     * Requests a password reset for a given email
     *
     * @param {string}  email   Email for user
     *
     * @returns {object}        Promise that resolves into data from server
     */
    function requestPasswordReset(email) {
        return Restangular.one('user/resetPassword').customPUT({email: email});
    }


    /**
     * @ngdoc method
     * @name setNewPassword
     * @methodOf ilWebClient.service:UserService
     * @description
     * Sets a new password using the user's password input and the temporary token for password reset
     *
     * @param {string}  password        User password
     * @param {string}  resetToken      Token for resetting password (from email URL)
     * @param {string}  endpoint        Endpoint to post (password create or password reset endpoints available)
     *
     * @returns {object}        Promise that resolves into data from server
     */
    function setNewPassword(password, resetToken, endpoint) {
        return Restangular.one('user/' + endpoint).customPUT({password: password, token: resetToken});
    }


    /**
     * @ngdoc method
     * @name getCurrentUser
     * @methodOf ilWebClient.service:UserService
     * @description
     * Function to retrieve the currently logged in user, as a promise
     *
     * @returns {object}        Promise that resolves into data from localstorage
     */
    function getCurrentUser() {
        return $q(function (resolve, reject) {
            resolve(JSON.parse($window.localStorage.getItem('user')));
        });
    }


    /**
     * @ngdoc method
     * @name setCurrentUser
     * @methodOf ilWebClient.service:UserService
     * @description
     * Function to set the current user for the app, as a promise
     *
     * @param {object}  userData        User data to store
     *
     * @returns {object}        Promise that resolves into data from local storage
     */
    function setCurrentUser(userData) {
        if (!userData) {
            throw new Error('User data must be present when saving it.');
        }

        return $q(function (resolve, reject) {
            if (userData.token) {
                $window.localStorage.setItem('token', userData.token);
            }
            if (userData.user) {
                $window.localStorage.setItem('user', JSON.stringify(userData.user));
            }
            _currentUserData = userData.user;
            resolve(_currentUserData);
        });
    }


    /**
     * @ngdoc method
     * @name isAuthenticated
     * @methodOf ilWebClient.service:UserService
     * @description
     * If no token is present in localStorage, return the user to the login screen
     *
     * @returns {boolean} Is user authenticated?
     */
    function isAuthenticated() {
        return $window.localStorage.getItem('token') !== undefined;
    }


    /**
     * @ngdoc method
     * @name hasRole
     * @methodOf ilWebClient.service:UserService
     * @description
     * Returns whether or not a user has a specific role
     *
     * @param {string}  role    Role to check on the user
     *
     * @returns {boolean}       Does the user have this role?
     */
    function hasRole(role) {
        if (!role) {
            throw new Error('Please provide a role to check!');
        }

        init();

        if (_currentUserData.authorities) {
            for (var i = 0; i < _currentUserData.authorities.length; i++) {
                if (_currentUserData.authorities[i].authority === role) {
                    return true;
                }
            }
        }

        return false;
    }


    /**
     * @ngdoc method
     * @name getRoles
     * @methodOf ilWebClient.service:UserService
     * @description
     * Get an object containing the user roles as keys and boolean values representing the user's access to that role
     *
     * @returns {object}    Object containing each possible role as keys, with boolean values for each, representing the user having each role or not
     */
    function getRoles() {
        var rolesObject = {};

        for (var property in ROLES) {
            if (ROLES.hasOwnProperty(property)) {
                rolesObject[property] = hasRole(ROLES[property]);
            }
        }
        return rolesObject;
    }


    /**
     * @ngdoc method
     * @name getRolesArray
     * @methodOf ilWebClient.service:UserService
     * @description
     * Compute an array of user roles for the logged in user
     *
     * @returns {Array}     Roles listed as array
     */
    function getRolesArray() {
        var rolesArr = [];

        init();

        for (var i = 0; i < _currentUserData.authorities.length; i++) {
            rolesArr.push(_currentUserData.authorities[i].authority);
        }

        return rolesArr;
    }


    /**
     * @ngdoc method
     * @name getHospitalPermissions
     * @methodOf ilWebClient.service:UserService
     * @description
     * Returns null if super-admin or object with permissions if other user
     *
     * @returns {object|null}       Hospital permissions for user
     */
    function getHospitalPermissions() {
        init();
        return _currentUserData.tenant != undefined ?  angular.copy(_currentUserData.components) : null;
    }


    /**
     * @ngdoc method
     * @name checkEmailToken
     * @methodOf ilWebClient.service:UserService
     * @description
     * Validates token for user registration
     *
     * @param {string}      token           Token received via email
     * @param {boolean}     isRegistering   Is the user registering as a new user?
     *
     * @returns {object}    promise         Promise that resolves into data from server
     */
    function checkEmailToken(token, isRegistering) {
        return Restangular.one('user/').customGET('validate-token', {token: token, tokenTypeRegister: isRegistering});
    }


    /**
     * @ngdoc method
     * @name invalidateToken
     * @methodOf ilWebClient.service:UserService
     * @description
     * Invalidates the token for the logged in user
     *
     * @returns {object} Promise
     */
    function invalidateToken() {
        if (isAuthenticated() && _currentUserData.checkInactivity) {
            return Restangular.one('user/invalidate-token').customPUT({});
        } else {
            return $q.reject('Keep token.');
        }
    }


    /**
     * @ngdoc method
     * @name getStoreURL
     * @methodOf ilWebClient.service:UserService
     * @description
     * Gets the app URL for users to download
     *
     * @returns {object}    promise     Promise that resolves into data from server
     */
    function getStoreIosURL() {
        return Restangular.one('user/mobileUrl/ios').customGET('');
    }

    /**
     * @ngdoc method
     * @name getStoreURL
     * @methodOf ilWebClient.service:UserService
     * @description
     * Gets the app URL for users to download
     *
     * @returns {object}    promise     Promise that resolves into data from server
     */
    function getStoreAndroidURL() {
        return Restangular.one('user/mobileUrl/android').customGET('');
    }

    return userServiceAPI;
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:animatedCheck
 * @scope
 * @restrict E
 *
 * @description
 * Animates a checkmark on selecting an item
 *
 * @param {bool}    is-checked  if the item is checked of not
 * @param {string}  text-color  color for the checkmark
 *
 */
angular.module('ilWebClient').directive('animatedCheck', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'js/common/animatedCheckmark/animatedCheckmark.html',
        link: function(scope, element, attrs) {
            scope.textColor = attrs.textColor;
            scope.checked = false;

            scope.$watch(attrs.isChecked, function(val) {
                if (val) {
                    scope.checked = true;
                    element.addClass('checked');
                } else {
                    scope.checked = false;
                    element.removeClass('checked');
                }
            })
        }
    }
});

'use strict';

(function() {
    angular.module('ilWebClient')
    .component('buttonToggle', {
        templateUrl: "js/components/button-toggle/il-button-toggle.html",
        controller: ButtonToggleController,
        controllerAs: 'buttonToggle',
        /*
         */
        bindings: {
            onToggle: '='
        }
      });

    function ButtonToggleController() {
        var buttonToggle = this;

        // TODO: intial state maybe should be retrieved by localstorage.
        buttonToggle.state = 1;

        buttonToggle.toggle = function(state) {
            buttonToggle.state = state;
            buttonToggle.onToggle(state);
        }
    }
})();
'use strict';

(function() {
    angular.module('ilWebClient')
    .component('ilCard', {
        templateUrl: 'js/components/cards/il-card.html',
        controller: CardController,
        controllerAs: 'card',
        /*
         */
        bindings: {
            allocation: '<',
            actions: '<',
            iconActions: '<'
        }
      });

    function CardController() {
        var card = this;
        card.expanded = false;
        card.expandIcon = 'expand_more';

        card.$onInit = function() {
            card.title = card.allocation.patientViewName ? card.allocation.patientViewName : card.allocation.allocationName;
            card.subheading = card.allocation.assetType ? card.allocation.assetType : 'Patient Type'
            card.content = {
                titles: [
                    'Status',
                    card.allocation.locationLabel
                ],
                data: [
                    card.allocation.allocationStatus ? card.allocation.allocationStatus : 'N/A',
                    card.allocation.location.room ? card.allocation.location.room : 'N/A'
                ]
            },
            card.hiddenContent = {
                titles: [
                    'Date'
                ], 
                data: [
                    card.allocation.entryDate
                ]
            }
        }

        // Expands the card to show extra data.
        card.expand = function() {
            card.expanded = !card.expanded;

            if (card.expanded) {
                card.expandIcon = 'expand_less';
            } else {
                card.expandIcon = 'expand_more';
            }
        }
    }
})();
'use strict';

(function() {
    angular.module('ilWebClient')
    .component('databar', {
        templateUrl: 'js/components/databar/il-databar.html',
        controller: DataBarController,
        controllerAs: 'databar',
        /*
         *
         */
        bindings: {
            freeBeacons: '<',
            usedBeacons: '<',
            onAllocate: '='
        }
      });

    function DataBarController() {
    }
})();
'use strict';

(function() {
    angular.module('ilWebClient')
    .component('ilFilterbar', {
        templateUrl: 'js/components/filterbar/il-filterbar.html',
        controller: FilterBarController,
        controllerAs: 'filterbar',
        bindings: {
            filters: '<',
            onFiltersApplied: '='
        }
      });

    function FilterBarController() {
        console.log("Filterbar Controller JS");
        var filterbar = this;

        filterbar.appliedFilters = {
            search: "",
            filters: {}
        };

        filterbar.clear = function() {
            console.log('clear');
            
            filterbar.appliedFilters = {
                search: "",
                filters: {}
            };

            filterbar.onFiltersApplied(filterbar.appliedFilters);
        }

        filterbar.onSearchInput = function() {
            filterbar.onFiltersApplied(filterbar.appliedFilters);
        };

        filterbar.onFilterSelected = function() {
            filterbar.onFiltersApplied(filterbar.appliedFilters);
        };
    }
})();
'use strict';

(function() {
    angular.module('ilWebClient')
    .component('sidefilter', {
        templateUrl: 'js/components/sidefilter/il-sidefilter.html',
        controller: SideFilterController,
        controllerAs: 'sidefilter',
        /*
         * filter - Array of objects with filter parameters.
         * Each object should contain the following
         * {
         *    title - Title of the filter section.
         *    options - Array of filter options.
         *          filter option element expected to have
         *          the following:
         *              {
         *                  label - text of the filter item
         *                  count - how many of that item are there
         *                  in the database.
         *              }
         * }
         */
        bindings: {
            filters: '<',
            onFiltersApplied: '='
        }
      })
      .directive('updateOnEnter', function() {
        return {
          restrict: 'A',
          require: 'ngModel',
          link: function(scope, element, attrs, ctrl) {
            element.on("keyup", function(ev) {
              // Our input is set to update on keyup, so if it's not ENTER, we stop
              // propagation to prevent the event from triggering angular's build in updater.
              if (ev.keyCode !== 13) return ev.stopImmediatePropagation();
              ctrl.$commitViewValue();
              scope.$apply(ctrl.$setTouched);
            });
          }
        }
      });

    function SideFilterController() {
        var sidefilter = this;
        var appliedFilters = {
            searchContent: '',
            room: [],
            doctor: [],
            status: [],
            type: []
        };

        sidefilter.clearAll = function() {
            appliedFilters.room = [];
            appliedFilters.doctor = [];
            appliedFilters.type = [];
            appliedFilters.status = [];

            angular.forEach(sidefilter.filters, function(filter) {
                angular.forEach(filter.options, function(option)  {
                    option.selected = false;
                })
            });

            sidefilter.onFiltersApplied(appliedFilters);
        };

        sidefilter.clearSection = function(sectionTitle) {
            switch(sectionTitle) {
                case 'Location':
                    appliedFilters.room = [];
                    break;
                case 'Physician':
                    appliedFilters.doctor = [];
                    break;
                case 'Asset Type':
                    appliedFilters.type = [];
                    break;
                case 'Status':
                    appliedFilters.status = [];
                    break;
                default:
                    console.log('Filter does not exist');
                    break;
            }

            angular.forEach(sidefilter.filters, function(filter) {
                if (filter.title === sectionTitle) {
                    angular.forEach(filter.options, function(option)  {
                        option.selected = false;
                    })
                }
            });

            sidefilter.onFiltersApplied(appliedFilters);
        };

        sidefilter.onSearchInput = function(input) {
            appliedFilters.searchContent = input

            sidefilter.onFiltersApplied(appliedFilters);
        };

        sidefilter.onFilterSelected = function(option, filterName) {
            switch(filterName) {
                case 'Location':
                    filterArrayHelper(appliedFilters.room, option);
                    break;
                case 'Physician':
                    filterArrayHelper(appliedFilters.doctor, option);
                    break;
                case 'Asset Type':
                    filterArrayHelper(appliedFilters.type, option);
                    break;
                case 'Status':
                    filterArrayHelper(appliedFilters.status, option);
                    break;
                default:
                    console.log('Filter does not exist');
                    break;
            }

            sidefilter.onFiltersApplied(appliedFilters);
        };

        function filterArrayHelper(array, option) {
            var index;
            
            // Needed since status doesn't use ID
            if (option.id === -1) {
                index = array.indexOf(option.label);
            } else {
                index = array.indexOf(option.id);
            }

            if (option.selected) {
                if (index === -1) {
                    // Needed since status doesn't use ID
                    if (option.id === -1) {
                        array.push(option.label);
                    } else {
                        array.push(option.id);
                    }
                    
                }
            } else {
                if (index > -1) {
                    array.splice(index, 1);
                }
            }
        }
    }
})();
'use strict';

(function() {
    SideNavController.$inject = ["$mdComponentRegistry"];
    angular.module('ilWebClient')
    .component('sidenav', {
        templateUrl: 'js/components/sidenav/il-sidenav.html',
        controller: SideNavController,
        controllerAs: 'sideNav',
        /*
         * toggle - Object to store toggle function.
         * list - Array of objects to use as the navigation
         * items. Should follow the following structure:
         * 
         * {
         *   label - name to be displayed
         *   icon - icon to be displayed
         *   route - state to transition to on click
         * }
         */
        bindings: {
            toggle: '=',
            list: '<'
        }
      });

    function SideNavController($mdComponentRegistry) {
        var sideNav = this;

        // Registering the fucntion to a 2 way binded object
        // Makes it easier since we don't have to keep track of state.
        // Parent will just toggle. Adds overhead with 2 way binding.
        // You win some, you lose some.
        sideNav.$onInit = function() {
            // Checking if we have list object
            // can't really use it if we don't.
            if (!sideNav.list) {
                throw new Error("IL SideNav: List not defined");
            }

            // Checking if what we are passed is an array.
            if (!angular.isArray(sideNav.list)) {
                throw new Error("IL SideNav: List is not an array");
            }

            sideNav.toggle.go = toggleSideNav; // Assigning fucntion to object
            sideNav.mdSideNav = null; // Declaring sidenav reference
            sideNav.selectedIndex = 0; // Tracking current index.
        }

        // Keeps track of selected item and closes side nav
        sideNav.onNavItemClicked = function(index) {
            sideNav.selectedIndex = index;
            sideNav.mdSideNav.close();
        }

        // Keeping a reference of the side nav after we know it's active.
        // JS will try to access it on initialization if you use
        // $mdSideNav(id) at any point giving error because it
        // won't be loaded. This seems to make things work better.
        $mdComponentRegistry.when('left').then(function(it){
            sideNav.mdSideNav = it;
        });

        // Toggling fuction for side nav
        function toggleSideNav() {
            if (sideNav.mdSideNav) {
                sideNav.mdSideNav.toggle();
            }
        }
    }
})();
'use strict';

(function() {
    TabBarController.$inject = ["$state"];
    angular.module('ilWebClient')
    .component('tabbar', {
        templateUrl: 'js/components/tabs/il-tabbar.html',
        controller: TabBarController,
        controllerAs: 'tabbar',
        /*
         * tabs - Array of objects with tab parameters.
         * Each object should contain the following
         * {
         *    route - state to transition to when a tab is clicked.
         *    label - title of a tab.
         * }
         */
        bindings: {
            tabs: '<'
        }
      });

    function TabBarController($state) {
        var tabbar = this;

        tabbar.$onInit = function() {
            // Checking if we have tabs object
            // can't really use it if we don't.
            if (!tabbar.tabs) {
                throw new Error("IL Tabs: Tabs not defined");
            }

            // Checking if what we are passed is an array.
            if (!angular.isArray(tabbar.tabs)) {
                throw new Error("IL Tabs: Tabs is not an array");
            }
        }

        // Transitions to the state denoted in by the tab.
        tabbar.onTabSelected = function(tab, index) {
            $state.transitionTo(tab.route);
        }

        // TODO: if we have another mechanism of changing the state 
        // that is tracked by a tab, the bar won't show the proper tab
        // as selected. Not urgent since we won't have this scenario in
        // Intelligent Locations web clients.
    }
})();
'use strict';

(function() {
    ToolBarController.$inject = ["UserService", "NotificationService"];
    angular.module('ilWebClient')
    .component('toolbar', {
        templateUrl: 'js/components/toolbar/il-toolbar.html',
        controller: ToolBarController,
        controllerAs: 'toolbar',
        /*
         * logo - String for the location of image to use as logo
         * user - Object forcurent user that's logged in.
         * Should follow the following structure:
         * {
         *    username - Identification of user
         *    role - role that denotes the priviledges user has.
         * }
         * 
         * onMenu - function that is called when user clicks on hamburger
         * menu
         */
        bindings: {
            logo: '<',
            user: '<',
            onMenu: '&',
            elevation: '<'
        }
      });

    function ToolBarController(UserService, NotificationService) {
        var toolbar = this;

        toolbar.$onInit = function() {
            if (!toolbar.elevation) {
                toolbar.elevation = 1;
            }
        }

        toolbar.menu = function() {
            console.log("menu clicked");

            // Could either use external function or
            // code implementation here.
            // Uncomment alog with binding to use
            // external call.
            // Comment or remove to write implementation here.
            toolbar.onMenu();
        }

        toolbar.logout = function() {
            console.log('logging out');
            UserService.logout();
        }

        toolbar.openUserMenu = function($mdMenu, ev) {
            $mdMenu.open(ev);
        }
    }
})();
'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:beaconCard
 * @scope
 * @restrict E
 *
 * @description
 * Displays/handles card information on dashboard
 *
 * @param {object}      allocation          allocation object to display/handle on card
 * @param {string}      cardType            type of card (patient/asset)
 * @param {function}    viewCallback        function to call on viewing the card
 * @param {function}    editCallback        function to call on editing the card
 * @param {function}    discardCallback     function to call on deleting the card
 * @param {function}    imCallback          function to call on sending an IM for the card
 *
 */
angular.module('ilWebClient').directive('beaconCard', ['UserService', function (UserService) {
    return {
        scope: {
            allocation: '=',
            viewCallback: '=',
            editCallback: '=',
            cardType: '=',
            discardCallback: '=',
            imCallback: '=',
            refreshCallback: '='
        },
        restrict: 'E',
        templateUrl: 'js/dashboard/beacon/card.html',
        link: function (scope, element, attr) {
            scope.ROLES = UserService.getRoles();
            scope.getCardStyle = getCardStyle;
            scope.getPatientName = getPatientName;

            function getPatientName(cardItem) {

                var cardTitle;
                if (typeof cardItem.meta === 'string') {
                    cardTitle = scope.ROLES.GPER ? cardItem.allocationName : cardItem.patientViewName.toUpperCase();
                    return cardTitle;
                } else {
                    cardTitle = scope.ROLES.GPER ? cardItem.allocationName : cardItem.patientViewName.toUpperCase();
                    return cardTitle;
                }

            }

            function getCardStyle(cardItem) {
                var color = cardItem.location && cardItem.location.color ? cardItem.location.color : 'transparent';
                var style = {};
                if (scope.cardType.toLowerCase() == 'patient') {
                    style['border-left'] = '5px solid ' + color;
                }
                return style;
            }
        }
    }
}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:AssetFormController
 * @description
 * Asset allocation creation controller used for submitting new allocations of type = asset
 */
angular.module('ilWebClient').controller('AssetFormController', ['$scope', '$mdDialog', 'beacons',
    'CrudFactory', 'model', 'NotificationService', 'AutocompleteHelperService', 'BeaconService', 'UtilService', 'GatewayService',
    function ($scope, $mdDialog, beacons, CrudFactory, model, NotificationService, AutocompleteHelperService, BeaconService, UtilService, GatewayService) {
        $scope.close = close;
        $scope.save = save;
        $scope.searchBeaconForQRCode = searchBeaconForQRCode;
        $scope.onSelectGateway = onSelectGateway;
        $scope.onSelectAssetType = onSelectAssetType;
        $scope.onSelectBeacon = onSelectBeacon;
        $scope.searchTextBeacon='';
        $scope.model = model || {};
        $scope.model.type = 'ASSET';
        $scope.beacons = [];
        $scope.types = [];
        $scope.gateways = [];
        $scope.validationErrors = null;
        $scope.loadingBeacon = false;
        $scope.querySearch = querySearch;
        var restService = new CrudFactory.CrudRest('beacon-allocation');

        function save() {
            $scope.validationErrors = null;
            var callback = $scope.model.id ? restService.update.bind(restService) : restService.create.bind(restService);
            callback($scope.model).then(function (result) {
                    $mdDialog.hide(result);
                    if ($scope.model.id) {
                        NotificationService.show('Successfully updated', 'success');
                    } else {
                        NotificationService.show('Successfully allocated', 'success');
                    }
                }, function (error) {
                    $scope.validationErrors = error.data.webErrors;
                    NotificationService.show('Error! Please try again', 'error');
                }
            )
        }

        function onSelectAssetType(){
            if(model.assetType && model.assetType.beaconProcessingType==='LOCATION'){
                model.meta.gateway=[];
                $scope.selectedGateway=null;
            }
        }

        function onSelectBeacon(){

        }

        function onSelectGateway(gateway){
            if(gateway) {
                $scope.model.meta.gateway=[];
                $scope.model.meta.gateway.push(gateway.uuid);
            }
        }

        function searchBeaconForQRCode(text){
            var beaconType = UtilService.getBeaconTypeFromQRCode(text);
            if(beaconType && beaconType === 'IBEACON'){
                searchBeaconForMAC(text);
            }else if(beaconType && beaconType === 'NEARABLE'){
                searchBeaconForNearableID(text)
            }
        }

        function searchBeaconForNearableID(text){
            var nearableId = text.split(":").length == 3 ? text.split(":")[1].replace('UUID','').trim()
                            : text.split("+").length == 3 ? text.split("+")[1].replace('UUID','').trim() : "";
            /*for (var i = 0; i < $scope.beacons.length; i++) {
                if (nearableId && $scope.beacons[i].nearableUUID && nearableId.toUpperCase() === $scope.beacons[i].nearableUUID.toUpperCase()) {
                    $scope.searchTextBeacon = $scope.beacons[i].name;
                    return;
                }
            }*/
            $scope.loadingBeacon = true;

            BeaconService
                .loadNearableByScannedData(nearableId)
                .then(function (result) {
                    var foundBeacon = false;
                    for (var i = 0; i < $scope.beacons.length; i++) {
                        if (result.id === $scope.beacons[i].id) {
                            foundBeacon = true;
                        }
                    }
                    if (!foundBeacon) {
                        $scope.beacons.push(result);
                    }
                    $scope.loadingBeacon = false;
                    $scope.searchTextBeacon = result.name;
                    NotificationService.show('Beacon found', 'success');

                    // Set the beacon in model so that autocomplete validates and 
                    // beacon isn't null.
                    $scope.model.beacon = result;

                    // Adding this for asthetics.
                    document.querySelector('#beaconAutoCompleteId').blur();
                })
                .catch(function (error) {
                    $scope.loadingBeacon = false;
                    UtilService.showErrorNotification(error, 'Could not load beacon');
                });
        }

        function searchBeaconForMAC(text) {
            if (!text || text.split('/').length !== 3) {
                return;
            }
            var macAddress = UtilService.numToMAC(text);

            for (var i = 0; i < $scope.beacons.length; i++) {
                if (macAddress && $scope.beacons[i].macAddr && macAddress.toUpperCase() === $scope.beacons[i].macAddr.toUpperCase()) {
                    $scope.searchTextBeacon = $scope.beacons[i].name;
                    return;
                }
            }

            $scope.loadingBeacon = true;

            BeaconService
                .loadIbeaconByScannedData(macAddress)
                .then(function (result) {
                    var foundBeacon = false;
                    for (var i = 0; i < $scope.beacons.length; i++) {
                        if (result.id === $scope.beacons[i].id) {
                            foundBeacon = true;
                        }
                    }
                    if (!foundBeacon) {
                        $scope.beacons.push(result);
                    }
                    $scope.loadingBeacon = false;
                    $scope.searchTextBeacon = result.name;
                    NotificationService.show('Beacon found', 'success');
                })
                .catch(function (error) {
                    $scope.loadingBeacon = false;
                    UtilService.showErrorNotification(error, 'Could not load beacon');
                });
        }

        function updateAssetTypes() {
            var assetTypeRestService = new CrudFactory.CrudRest('dictionary/asset/type');
            var hospitalFilter = {};

            if (model && model.hospital) {
                hospitalFilter.hospital = model.hospital.id;
            }

            assetTypeRestService.list(hospitalFilter).then(function (assetTypeList) {
                $scope.types = assetTypeList;
            })
        }

        function loadGateways(){
            GatewayService.getUnassigned().then(function(result){
                $scope.gateways = result;
                postLoad();
            })
            .catch(function(error){
                UtilService.showErrorNotification(error, 'Could not load gateways');
            })
        }

        function postLoad(){
            if(model.meta && model.meta.gateway && model.meta.gateway.length>0){
                GatewayService.getGateway(model.meta.gateway[0]).then(function(data){
                    $scope.selectedGateway = data;
                    $scope.gateways.push(data);
                })
            }else if(model.meta == null){
                model.meta = {gateway:[]};
            }else{
                model.meta.gateway = [];
            }
        }

        function buildBeaconsArray() {
            if (model.beacon) {
                $scope.beacons.push(model.beacon);
            }
            for (var i = 0; i < beacons.length; i++) {
                if (model && model.hospital) {
                    if (beacons[i].hospital.id == model.hospital.id) {
                        $scope.beacons.push(beacons[i]);
                    }
                } else {
                    $scope.beacons.push(beacons[i]);
                }
            }
        }

        function close() {
            $mdDialog.cancel();
        }

        function querySearch(search, array, prop) {
            var result = AutocompleteHelperService.filter(search, array, prop);
            return AutocompleteHelperService.querySearch(null, null, result);
        }
        loadGateways();
        buildBeaconsArray();
        updateAssetTypes();

        $scope.onBlur = function() {
            // If we don't have a beacon, sometimes it's because 
            // the user typed it up. Autocomplete fails to assign if
            // there are multiple options. Using this call
            // to ensure a beacon if user typed up it's name.
            if ($scope.model.beacon === null) {
                var results = AutocompleteHelperService.filter($scope.searchTextBeacon, beacons, "name");

                for(var index in results) {
                    var beacon = results[index];
                    if (beacon.name.toUpperCase() === $scope.searchTextBeacon.toUpperCase()) {
                        console.log($scope.form.autocomplete);
                        $scope.model.beacon = beacon;
                    }
                }
            }
        }
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:HospitalFormController
 * @description
 * Handles the population and selection of hospitals for multi-step forms
 */
angular.module('ilWebClient').controller('HospitalFormController', ['$scope', '$mdDialog', 'beacons', 'type',
    'CrudFactory', 'model', 'AutocompleteHelperService',
    function ($scope, $mdDialog, beacons, type, CrudFactory, model, AutocompleteHelperService) {
        $scope.close = close;
        $scope.proceed = proceed;
        $scope.model = model || {};
        $scope.beacons = beacons;
        $scope.querySearch = querySearch;
        var restService = new CrudFactory.CrudRest('hospital');

        var filter = {};

        if (type === 'asset') {
            filter.atrak = true;
        } else if (type === 'patient') {
            filter.ptrak = true;
        }

        restService.list(filter).then(function (hospitalList) {
            $scope.hospitals = hospitalList;
        });

        $scope.types = [
            {
                name: 'PCA PUMP'
            }
        ];
        function proceed() {
            $mdDialog.hide($scope.model.hospital);
        }

        function close() {
            $mdDialog.cancel();
        }

        function querySearch(search) {
            var result = AutocompleteHelperService.filter($scope.searchText, $scope.hospitals, 'name');
            return AutocompleteHelperService.querySearch(null, null, result);
        }
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:PatientFormController
 * @description
 * Patient allocation creation controller used for submitting new allocations of type = patient
 */
angular.module('ilWebClient').controller('PatientFormController', ['$scope', '$mdDialog', 'beacons',
    'CrudFactory', 'model', 'NotificationService', 'AutocompleteHelperService', 'UtilService', 'BeaconService', function ($scope, $mdDialog, beacons, CrudFactory, model, NotificationService, AutocompleteHelperService, UtilService, BeaconService) {
        $scope.countryCodes= allCountries;
        $scope.close = close;
        $scope.save = save;
        $scope.searchBeaconForQRCode = searchBeaconForQRCode;
        $scope.model = model || {};
        $scope.model.type = 'PATIENT';
        $scope.validationErrors = null;
        $scope.minDate = new Date();
        $scope.loadingBeacon = false;
        $scope.maxDatetimeLocal = new Date('9999/12/31T00:00:00');
        $scope.phoneNumber = "";
        $scope.countryCode = $scope.countryCodes[0];
        $scope.onAddPhoneNumber = function(){
            model.meta.phoneNumbers.push("(" + $scope.countryCode[2] + ")" + $scope.phoneNumber);
            $scope.countryCode = $scope.countryCodes[0];
            $scope.phoneNumber = "";
        };

        if ($scope.model.meta) {
            $scope.model.meta.phoneNumbers = $scope.model.meta.phoneNumbers || [];
        } else {
            $scope.model.meta = {
                phoneNumbers: []
            }
        }
        if ($scope.model.meta.surgeryDate) {
            $scope.model.meta.surgeryDate = new Date($scope.model.meta.surgeryDate);
        }

        if ($scope.model.meta.surgeryTime) {
            $scope.model.meta.surgeryTime = new Date($scope.model.meta.surgeryTime);
        }

        if ($scope.model.meta.surgeryDateTime) {
            $scope.model.meta.surgeryDateTime = new Date($scope.model.meta.surgeryDateTime);
        }

        $scope.beacons = [];
        $scope.doctors = [];
        $scope.anesthesiologists = [];
        $scope.nurses = [];
        $scope.surgeryTypes = [];
        $scope.querySearch = querySearch;
        var restService = new CrudFactory.CrudRest('beacon-allocation');

        function searchBeaconForQRCode(text){
            var beaconType = UtilService.getBeaconTypeFromQRCode(text);
            if(beaconType && beaconType === 'IBEACON'){
                searchBeaconForMAC(text);
            }else if(beaconType && beaconType === 'NEARABLE'){
                searchBeaconForNearableID(text)
            }
        }

        function searchBeaconForNearableID(text){
            var nearableId = text.split(":").length == 3 ? text.split(":")[1].replace('UUID','').trim()
                : text.split("+").length == 3 ? text.split("+")[1].replace('UUID','').trim() : "";
            /*for (var i = 0; i < $scope.beacons.length; i++) {
                if (nearableId && $scope.beacons[i].nearableUUID && nearableId.toUpperCase() === $scope.beacons[i].nearableUUID.toUpperCase()) {
                    $scope.searchTextBeacon = $scope.beacons[i].name;
                    return;
                }
            }*/
            $scope.loadingBeacon = true;

            BeaconService
                .loadNearableByScannedData(nearableId)
                .then(function (result) {
                    var foundBeacon = false;
                    for (var i = 0; i < $scope.beacons.length; i++) {
                        if (result.id === $scope.beacons[i].id) {
                            foundBeacon = true;
                        }
                    }
                    if (!foundBeacon) {
                        $scope.beacons.push(result);
                    }
                    $scope.loadingBeacon = false;
                    $scope.searchTextBeacon = result.name;

                    // Set the beacon in model so that autocomplete validates and 
                    // beacon isn't null.
                    $scope.model.beacon = result;
                    
                    // Adding this for asthetics.
                    document.querySelector('#beaconAutoCompleteId').blur();
                })
                .catch(function (error) {
                    $scope.loadingBeacon = false;
                    UtilService.showErrorNotification(error, 'Could not load beacon');
                });
        }

        function searchBeaconForMAC(text) {
            if (!text || text.split('/').length !== 3) {
                return;
            }
            var macAddress = UtilService.numToMAC(text);

            for (var i = 0; i < $scope.beacons.length; i++) {
                if (macAddress && $scope.beacons[i].macAddr && macAddress.toUpperCase() === $scope.beacons[i].macAddr.toUpperCase()) {
                    $scope.searchTextBeacon = $scope.beacons[i].name;
                    return;
                }
            }

            $scope.loadingBeacon = true;

            BeaconService
                .loadIbeaconByScannedData(macAddress)
                .then(function (result) {
                    var foundBeacon = false;
                    for (var i = 0; i < $scope.beacons.length; i++) {
                        if (result.id === $scope.beacons[i].id) {
                            foundBeacon = true;
                        }
                    }
                    if (!foundBeacon) {
                        $scope.beacons.push(result);
                    }
                    $scope.loadingBeacon = false;
                    $scope.searchTextBeacon = result.name;
                    NotificationService.show('Beacon found', 'success');
                })
                .catch(function (error) {
                    $scope.loadingBeacon = false;
                    UtilService.showErrorNotification(error, 'Could not load beacon');
                });
        }

        function save() {
            $scope.validationErrors = null;
            var callback = $scope.model.id ? restService.update.bind(restService) : restService.create.bind(restService);
            callback($scope.model).then(function (result) {
                    $mdDialog.hide(result);
                    if ($scope.model.id) {
                        NotificationService.show('Successfully updated', 'success');
                    } else {
                        NotificationService.show('Successfully allocated', 'success');
                    }
                }, function (error) {
                    $scope.validationErrors = error.data.webErrors;
                    NotificationService.show('Error! Please try again', 'error');
                }
            )
        }

        function buildBeaconsArray() {
            if (model.beacon) {
                $scope.beacons.push(model.beacon);
            }
            for (var i = 0; i < beacons.length; i++) {
                if (model && model.hospital) {
                    if (beacons[i].hospital.id == model.hospital.id) {
                        $scope.beacons.push(beacons[i]);
                    }
                } else {
                    $scope.beacons.push(beacons[i]);
                }
            }
        }

        function close() {
            $mdDialog.cancel();
        }

        function querySearch(search, array, prop) {
            var result = AutocompleteHelperService.filter(search, array, prop);
            return AutocompleteHelperService.querySearch(null, null, result);
        }

        function getEntities(route, container, getObject) {
            var restService = new CrudFactory.CrudRest(route);
            var filter = {
                hospital: $scope.model.hospital ? $scope.model.hospital.id : null
            };
            var query = getObject === true ? restService.get(filter) : restService.list(filter);
            query.then(function (result) {
                result = result.plain();
                $scope[container] = result.hasOwnProperty('values') ? result.values : result;
            });
        }

        function getDoctors() {
            getEntities('user/doctor', 'doctors');
        }

        function getAnesthesiologists() {
            getEntities('user/anesthesiologist', 'anesthesiologists');
        }

        function getSurgeryTypes() {
            getEntities('dictionary/SURGERY', 'surgeryTypes', true);
        }

        $scope.onBlur = function() {
            // If we don't have a beacon, sometimes it's because 
            // the user typed it up. Autocomplete fails to assign if
            // there are multiple options. Using this call
            // to ensure a beacon if user typed up it's name.
            if ($scope.model.beacon === null) {
                var results = AutocompleteHelperService.filter($scope.searchTextBeacon, beacons, "name");

                for(var index in results) {
                    var beacon = results[index];
                    if (beacon.name.toUpperCase() === $scope.searchTextBeacon.toUpperCase()) {
                        $scope.model.beacon = beacon;
                    }
                }
            }
        }

        getSurgeryTypes();
        getDoctors();
        getAnesthesiologists();
        buildBeaconsArray();
    }]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:associateAction
 * @scope
 * @restrict E
 *
 * @description
 * Handles allocation creation and free beacon display from dashboard
 *
 * @param {string}      type                allocation object to display/handle on card
 * @param {string}      freeBeaconCount     type of card (patient/asset)
 * @param {function}    addCallback         function to call on viewing the card
 *
 */
angular.module('ilWebClient').directive('associateAction', ['HospitalThemeService', function (HospitalThemeService) {
    return {
        scope: {
            type: '@',
            freeBeaconCount: '@',
            addCallback: '='
        },
        restrict: 'E',
        templateUrl: 'js/dashboard/directives/associateAction.html',
        link: function (scope, element, attributes) {
            element.addClass('');

            HospitalThemeService
                .loadTheme()
                .then(function (theme) {
                    scope.theme = theme;
                })
                .catch(function (err) {
                    // TODO: handle error in loading theme
                });
        }
    }
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:dateOffset
 * @scope
 * @restrict A
 *
 * @description
 * Takes timezone into consideration and allows <md-datepicker> to save GMT time instead of local time
 *
 */
angular.module('ilWebClient').directive('dateOffset', [function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ngModel) {
            var toView = function (val) {
                return val;
            };

            var toModel = function (val) {
                var offset = val.getTimezoneOffset();
                return new Date(val.getTime() - offset * 60 * 1000);
            };

            ngModel.$formatters.unshift(toView);
            ngModel.$parsers.unshift(toModel);
        }
    }
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:filterArea
 * @scope
 * @restrict E
 *
 * @description
 * Handles filter area in dashboard for allocations
 *
 * @param {string}  type    type of entity the filter is applied to
 *
 */
angular.module('ilWebClient').directive('filterArea', ['CrudFactory', 'UserService', function (CrudFactory, UserService) {
    return {
        scope: {
            type: '='
        },
        restrict: 'E',
        templateUrl: 'js/dashboard/directives/filter.html',
        link: function (scope, element, attributes) {
            scope.resetFilters = resetFilters;
            scope.applyFilters = applyFilters;
            scope.reloadStatuses = reloadStatuses;
            scope.showStatuses = true;
            scope.ROLES = UserService.getRoles();
            var hospitalId = null;

            scope.filter = {};
            scope.filters = {
                rooms: [],
                statuses: [],
                doctors: [],
                hospitals: [],
                surgery_types: [],
                types: []
            };

            scope.$on('dashboard.filter.clear', function(e, data) {
                scope.filter = {};
                hospitalId = null;
            });

            function resetFilters() {
                scope.filter = {};
                hospitalId = null;
                updateRoomList();
                updateAssetTypeList();
                updateDoctorsList();
                reloadStatuses();
                scope.$emit('dashboard.quick-filter.clear');
                scope.$emit('dashboard.filter');
            }

            function applyFilters() {
                updateRoomList();
                scope.$emit('dashboard.quick-filter.clear');
                scope.$emit('dashboard.filter', scope.filter, getAssetTypeName(scope.filter.assetTypeId));
            }

            function getAssetTypeName(assetTypeId){
                for(var i=0; i<scope.filters.types.length; i++){
                    if(scope.filters.types[i].id == assetTypeId) return scope.filters.types[i].name;
                }
            }

            function updateRoomList() {
                var restService = new CrudFactory.CrudRest('room');
                restService.list().then(function (roomList) {
                    scope.filters.rooms = roomList;
                });
            }

            function updateAssetTypeList() {
                var restService = new CrudFactory.CrudRest('dictionary/asset/type');
                restService.list().then(function (assetTypes) {
                    var tmp = [];
                    for (var i = 0; i < assetTypes.length; i++) {
                        tmp.push({
                            name: assetTypes[i].name,
                            id: assetTypes[i].id
                        })
                    }
                    scope.filters.types = tmp;
                });
            }

            function updateStatusList(id) {
                var endpointUrl = id ? 'dictionary/asset/type/' + id + '/statusObj' : 'dictionary/asset/type/status';
                var restService = new CrudFactory.CrudRest(endpointUrl);
                restService.list().then(function (statusesList) {
                    scope.filters.statuses = statusesList;
                });
            }

            function updateDoctorsList() {
                var restService = new CrudFactory.CrudRest('user/doctor');
                restService.list().then(function (doctorsList) {
                    scope.filters.doctors = doctorsList;
                });
            }

            function reloadStatuses(assetTypeId) {
                scope.filter.status = null;
                updateStatusList(assetTypeId);
            }

            function updateAllFields() {
                updateStatusList();
                updateAssetTypeList();
                updateRoomList();
                updateDoctorsList();
            }

            updateAllFields();
        }
    }
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:freeTextSearchForm
 * @scope
 * @restrict E
 *
 * @description
 * Handles search area in dashboard for allocations
 *
 */
angular.module('ilWebClient').directive('freeTextSearchForm', [function () {
  return {
    scope: {
    },
    restrict: 'E',
    templateUrl: 'js/dashboard/directives/free-text-search-form.html',
    link: function(scope,element,attributes) {
      scope.search = search;
      scope.reset = reset;

      scope.$on('dashboard.search.clear', function(e, data) {
          scope.search.text = '';
      });

      function search(searchText) {
        scope.$emit('dashboard.quick-filter.clear');
        scope.$emit('dashboard.search', {searchContent: searchText});
      }

      function reset() {
        scope.search.text = '';
        scope.$emit('dashboard.quick-filter.clear');
        scope.$emit('dashboard.search');
      }
    }
  }
}]);

'use strict';

/**
 * @ngdoc directive
 * @name ilWebClient.directive:thermometer
 * @scope
 * @restrict E
 *
 * @description
 * A directive for handling thermometer rendering
 *
 */

angular.module('ilWebClient').directive('tgThermometerVertical', ['$window',function ($window) {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'js/dashboard/directives/thermometer.html',
        link: function(scope, elem, attrs) {

            scope.size = attrs.size;
            scope.height = attrs.height;
            scope.percent = attrs.percent;

            console.log(scope);
        }
    };
}])

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:IMFormController
 * @description
 * Handles instant messaging with entities attached to the cards it's present on; relays text to server which delivers it accordingly
 */
angular.module('ilWebClient').controller('IMFormController', ['$scope', '$mdDialog', 'allocation', 'UserActionsService', 'NotificationService', function ($scope, $mdDialog, allocation, UserActionsService, NotificationService) {

    //TODO: get text for each hospital from server endpoint
    $scope.message = {};
    $scope.close = closeModal;
    $scope.sendMessage = sendMessage;

    function sendMessage() {
        UserActionsService
            .sendUserMessage(allocation.allocationId, $scope.message)
            .then(handleMessageSuccess)
            .catch(handleMessageError);
    }

    function closeModal() {
        $mdDialog.cancel();
    }

    function handleMessageSuccess(serverResponse) {
        NotificationService.show('Your message was sent successfully', 'success');
        closeModal();
    }

    function handleMessageError(error) {
        NotificationService.show('Error! Please try again', 'error');
    }

}]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:AssetViewController
 * @description
 * Handles viewing of asset information
 */
angular.module('ilWebClient').controller('AssetViewController', ['$scope', '$mdDialog', 'allocation', 'BeaconService', 'CrudFactory', 'UserService', 'mapOptions', 'mapFeatures',
    function ($scope, $mdDialog, allocation, BeaconService, CrudFactory, UserService, mapOptions, mapFeatures) {
        var assetDetails = this;
        assetDetails.allocation = allocation;
        assetDetails.allocation.history = [];
        assetDetails.ROLES = UserService.getRoles();

        var receivedEmptyHistoryResponse = false;

        function initAllocationMap() {
            $scope.allocationOptions = mapOptions;
            $scope.allocationFeatures = mapFeatures;
        }

        initAllocationMap();


        /**
         * Flag to indicate of a request is in progress for new history
         * @type {boolean}
         */
        var isBusyRequestingData = false;

        /**
         * Page number to be requested from server
         * @type {number}
         */
        $scope.page = 1;

        /**
         * Maximum number of results to be included by the server in its response
         * @type {number}
         */
        $scope.limit = 30;

        assetDetails.close = function() {
            $mdDialog.cancel();
        }

        /**
         * Function that loads location history for an allocation card, page by page with infinite scroll.
         * If the server responds with an empty array, we've reached the end of our pages and stop infinite scroll behaviour.
         */
        function loadAllocationHistory() {
            if (isBusyRequestingData) {
                return;
            }
            isBusyRequestingData = true;
            var filter = {
                beaconAllocationId: assetDetails.allocation.id,
                page: $scope.page,
                limit: $scope.limit
            };
            var restService = new CrudFactory.CrudRest('beacon-allocation/history/');
            restService.list(filter).then(function (allocationHistory) {
                for (var i = 0; i < allocationHistory.length; i++) {
                    assetDetails.allocation.history.push(allocationHistory[i])
                }
                $scope.page += 1;
                if (allocationHistory.length == 0) {
                    receivedEmptyHistoryResponse = true;
                }
                isBusyRequestingData = false;
            });
        }

        loadAllocationHistory();

        assetDetails.edit = function() {
            $mdDialog.show({
                templateUrl: 'js/dashboard/create/asset.html',
                parent: angular.element(document.body),
                controller: 'AssetFormController',
                locals: {
                    model: assetDetails.allocation,
                    beacons: BeaconService.available()
                },
                bindToController: true,
                escapeToClose: false,
                fullscreen: true
            })
            .then(function (result) {
                //TODO: update views.
            }, function () {
                getAvailableBeacons();
                //TODO: any cleanup after cancel
            });
        }

        assetDetails.discard = function() {
            BeaconAllocationService
                .getAllocation(assetDetails.allocation)
                .then(function (object) {
                    var discardDialog = $mdDialog.confirm()
                        .title('Would you like to discharge the selected allocation?')
                        .htmlContent('\<span class="modal-custom-body">You will no longer be able to track the ' + $scope.type + '</span>')
                        .ariaLabel('Discard allocation')
                        .ok('Yes')
                        .cancel('No');
                    $mdDialog.show(discardDialog).then(function () {
                        BeaconAllocationService.deallocate(object).then(function () {
                            NotificationService.show('Successfully discharged', 'success');
                            // TODO: update views.
                        });
                    }, function () {});
                }, function (error) {
                    NotificationService.show('Error! Please try again', 'error');
                });
        }
    }]);

'use strict';

/**
 * @ngdoc controller
 * @name ilWebClient.controller:PatientViewController
 * @description
 * Handles viewing of patient information
 */
angular.module('ilWebClient')
       .controller('PatientViewController', ['$scope', '$mdDialog', 'allocation', 'CrudFactory', 'UserService', 'BeaconService', 'BeaconAllocationService', 'mapOptions', 'mapFeatures',
    function ($scope, $mdDialog, allocation, CrudFactory, UserService, BeaconService, BeaconAllocationService, mapOptions, mapFeatures) {
        var patientDetails = this;

        patientDetails.allocation = allocation;
        patientDetails.allocation.history = [];
        $scope.getRoomColor = getRoomColor;
        $scope.ROLES = UserService.getRoles();
        $scope.theme = null;

        var receivedEmptyHistoryResponse = false;

        function initAllocationMap() {
            $scope.allocationOptions = mapOptions;
            $scope.allocationFeatures = mapFeatures;
        }
        initAllocationMap();


        $scope.$on('leafletDirectiveGeoJson.mouseover', function (ev, leafletPayload) {
            //TODO: handle mouseover geojson feature
        });


        /**
         * Flag to indicate of a request is in progress for new history
         * @type {boolean}
         */
        var isBusyRequestingData = false;

        /**
         * Page number to be requested from server
         * @type {number}
         */
        $scope.page = 1;

        /**
         * Maximum number of results to be included by the server in its response
         * @type {number}
         */
        $scope.limit = 30;

        patientDetails.close = function() {
            $mdDialog.cancel();
        }

        /**
         * Returns a string representing the styling for left border on room in allocation history
         * @param {object} room
         * @returns {string}
         */
        function getRoomColor(room) {
            return room.color ? '5px solid ' + room.color : '5px solid transparent';
        }

        /**
         * Function that loads location history for an allocation card, page by page with infinite scroll.
         * If the server responds with an empty array, we've reached the end of our pages and stop infinite scroll behaviour.
         */
        function loadAllocationHistory() {
            if (isBusyRequestingData) {
                return;
            }
            isBusyRequestingData = true;
            var filter = {
                beaconAllocationId: patientDetails.allocation.id,
                page: $scope.page,
                limit: $scope.limit
            };
            var restService = new CrudFactory.CrudRest('beacon-allocation/history/');
            restService.list(filter).then(function (allocationHistory) {
                for (var i = 0; i < allocationHistory.length; i++) {
                    patientDetails.allocation.history.push(allocationHistory[i]);
                }
                $scope.page += 1;
                if (allocationHistory.length === 0) {
                    receivedEmptyHistoryResponse = true;
                }
                isBusyRequestingData = false;
            });
        }

        loadAllocationHistory();


        patientDetails.edit = function() {
            $mdDialog.show({
                templateUrl: 'js/dashboard/create/patient.html',
                parent: angular.element(document.body),
                controller: 'PatientFormController',
                locals: {
                    model: patientDetails.allocation,
                    beacons: BeaconService.available()
                },
                bindToController: true,
                escapeToClose: false,
                fullscreen: true
            })
            .then(function (result) {
                //TODO: update views.
            }, function () {
                getAvailableBeacons();
                //TODO: any cleanup after cancel
            });
        }

        patientDetails.discard = function() {
            BeaconAllocationService
                .getAllocation(patientDetails.allocation)
                .then(function (object) {
                    var discardDialog = $mdDialog.confirm()
                        .title('Would you like to discharge the selected allocation?')
                        .htmlContent('\<span class="modal-custom-body">You will no longer be able to track the ' + $scope.type + '</span>')
                        .ariaLabel('Discard allocation')
                        .ok('Yes')
                        .cancel('No');
                    $mdDialog.show(discardDialog).then(function () {
                        BeaconAllocationService.deallocate(object).then(function () {
                            NotificationService.show('Successfully discharged', 'success');
                            // TODO: update views.
                        });
                    }, function () {});
                }, function (error) {
                    NotificationService.show('Error! Please try again', 'error');
                });
        }
    }
]);

/**
 *
 * The MIT License (MIT)
 * Copyright (c) 2016 Crawlink
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 */


(function () {
    'use strict';

    angular.module('cl-paging', [])
    .directive('clPaging', ClPagingDirective);

    ClPagingDirective.$inject = [];
    function ClPagingDirective() {
        return {
            restrict: 'EA',
            scope: {
                clPages: '=',
                clAlignModel: '=',
                clPageChanged: '&',
                clSteps: '=',
                clCurrentPage: '='
            },
            controller: ClPagingController,
            controllerAs: 'vm',
            template: [
                '<md-button class="md-icon-button" aria-label="First" ng-click="vm.gotoFirst()" md-colors="{color: \'accent-400\'}">{{ vm.first }}</md-button>',
                '<md-button class="md-icon-button" aria-label="Previous" ng-click="vm.gotoPrev()" ng-show="vm.index - 1 >= 0">&#8230;</md-button>',
                '<md-button class="md-icon-button" aria-label="Go to page {{i+1}}" ng-repeat="i in vm.stepInfo"',
                ' ng-click="vm.goto(vm.index + i)" ng-show="vm.page[vm.index + i]" ',
                ' ng-class="{\'md-primary\': vm.page[vm.index + i] == clCurrentPage}">',
                ' {{ vm.page[vm.index + i] }}',
                '</md-button>',
                '<md-button class="md-icon-button" aria-label="Next" ng-click="vm.gotoNext()" ng-show="vm.index + vm.clSteps < clPages">&#8230;</md-button>',
                '<md-button class="md-icon-button" aria-label="Last" ng-click="vm.gotoLast()" md-colors="{color: \'accent-400\'}">{{ vm.last }}</md-button>',
            ].join('')
        };
    }

    ClPagingController.$inject = ['$scope'];
    function ClPagingController($scope) {
        var vm = this;

        vm.first = '<<';
        vm.last = '>>';

        vm.index = 0;

        vm.clSteps = $scope.clSteps;

        vm.goto = function (index) {
            $scope.clCurrentPage = vm.page[index];
        };

        vm.gotoPrev = function () {
            $scope.clCurrentPage = vm.index;
            vm.index -= vm.clSteps;
        };

        vm.gotoNext = function () {
            vm.index += vm.clSteps;
            $scope.clCurrentPage = vm.index + 1;
        };

        vm.gotoFirst = function () {
            vm.index = 0;
            $scope.clCurrentPage = 1;
        };

        vm.gotoLast = function () {
            vm.index = parseInt($scope.clPages / vm.clSteps) * vm.clSteps;
            vm.index === $scope.clPages ? vm.index = vm.index - vm.clSteps : '';
            $scope.clCurrentPage = $scope.clPages;
        };

        $scope.$watch('clCurrentPage', function (value) {
            vm.index = parseInt((value - 1) / vm.clSteps) * vm.clSteps;
            $scope.clPageChanged();
        });

        $scope.$watch('clPages', function () {
            vm.init();
        });

        vm.init = function () {
            vm.stepInfo = (function () {
                var result = [];
                for (var i = 0; i < vm.clSteps; i++) {
                    result.push(i)
                }
                return result;
            })();

            vm.page = (function () {
                var result = [];
                for (var i = 1; i <= $scope.clPages; i++) {
                    result.push(i);
                }
                return result;
            })();

        };
    };


})();
/**
 * @ngdoc controller
 * @name ilWebClient.controller:AssetsTabController
 * @description
 * Controller for the assets tab on dashboard.
 */
(function() {
    'use strict';

    AssetsTabController.$inject = ["$scope", "$mdDialog", "CrudFactory", "BeaconAllocationService", "UserService"];
    angular.module('ilWebClient')
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider
        .state('main.dashboard.assets', {
            url: '/assets',
            component: 'assetsTabController',
            resolve: {
                layout: function () {
                    return 'column';
                },
                layoutFill: function() {
                    return true;
                }
            }
        });
    }])
    .component('assetsTabController', {
        templateUrl: 'js/dashboard/tabs/assets/db-assets-tab.html',
        controller: AssetsTabController,
        controllerAs: 'assetsTab',
        bindings: {
            filters: '<',
            viewState: '<',
            layout: '@',
            layoutFill: '@'
        }
    });

    function AssetsTabController($scope, $mdDialog, CrudFactory, BeaconAllocationService, UserService) {
        var assetsTab = this;
        assetsTab.allocations = [];
        assetsTab.filtersApplied = false;
        assetsTab.ROLES = UserService.getRoles();

        assetsTab.currentPage = 1;
        assetsTab.pages = 100;

        assetsTab.selectedItems = [];

        // These are the only actions we support on assets cards currently.
        assetsTab.actions = [
            {
                icon: 'gps_fixed',
                onAction: locateAsset
            },
            {
                icon: 'info',
                onAction: getAssetDetails
            }
        ];

        assetsTab.columns = {
            allocationName: {
                name: 'ID'
            },
            assetType:{
                name: 'Asset type'
            },
            location: {
                name: 'LOCATION',
                displayProperty: 'room',
                hideColumn: function (item, column) {
                    return !item.location || !item.location.isCurrent;
                },
                getValue: function (item, column) {
                    if (item.beaconProcessingType === 'LOCATION' && !this.hideColumn(item, column)) {
                        return getConcatLocation(item, column);
                    } else {
                        return '-';
                    }
                }
            },
            lastKnownLocation: {
                name: 'LAST KNOWN LOCATION',
                columnAlias: 'location',
                displayProperty: 'room',
                hideColumn: function (item, column) {
                    return !item.location || item.location.isCurrent;
                },
                getValue: function (item, column) {
                    if (item.beaconProcessingType === 'LOCATION' && !this.hideColumn(item, column)) {
                        return getConcatLocation(item, column);
                    } else {
                        return '-';
                    }
                }
            },
            allocationStatus: {
                name: 'STATUS'
            },
            entryDate: {
                name: 'IN',
                isDate: true,
                getValue: function (item, column) {
                    if (item.beaconProcessingType === 'LOCATION') {
                        return item.entryDate;
                    } else {
                        return item.movementStartDate;
                    }
                }
            },
            movementCount: {
                name: 'COUNT'
            }
        };

        assetsTab.getMainContentFromAllocation = function(allocation) {
            return {
                one: allocation.location.room ? allocation.location.room : 'N/A',
                two: allocation.allocationStatus ? allocation.allocationStatus : 'N/A'
            };
        };

        assetsTab.getHiddenContentFromAllocation = function(allocation) {
            return {
                one: allocation.entryDate
            };
        };

        assetsTab.onNewPage = function() {
            console.log('New Page');
        };

        assetsTab.$onChanges = function(changes) {
            if (changes.filters && !angular.equals(changes.filters.previousValue, {})) {
                assetsTab.filtersApplied = checkAppliedFilters();
                loadAssets();
            }
        };
            
        loadAssets();

        function loadAssets() {
            var beaconRestService = new CrudFactory.CrudRest('beacon-allocation');
            beaconRestService.list(assetsTab.filters).then(function (result) {
                assetsTab.cards = [];
                assetsTab.allocations = [];

                result.forEach(function (item) {
                    if(assetsTab.allocations.filter(function(asset){return asset.allocationId === item.allocationId;}).length === 0) {
                        assetsTab.allocations.push(item);
                    }
                });
            });
        }

        // Duplicated function. We should add it in a more universal location.
        function checkAppliedFilters() {
            // Returns true if filters are applied
        }

        function getConcatLocation(item, column) {
            if (!item.location || (!item.location.area && !item.location.room)) {
                return '-';
            } else if (item.location.area && !item.location.room) {
                return item.location.area;
            } else if (!item.location.area && item.location.room) {
                return item.location.room;
            } else {
                return item.location.area + ', ' + item.location.room;
            }
        }

        assetsTab.getAssetDetails = function(allocation) {
            getAssetDetails(allocation);
        }

        /* Action Functions */
        function getAssetDetails(allocation) {
            console.log('Getting details for ' + allocation.allocationName);

            if (assetsTab.ROLES.GPER) {
                return;
            }

            BeaconAllocationService
                .getAllocation(allocation)
                .then(function (result) {
                    result.location = allocation.location;
                    result.locationLabel = allocation.locationLabel;
                    result.entryDate = allocation.entryDate;
                    var templateName = "asset" + '_' + allocation.beaconProcessingType.toLowerCase();
                    BeaconAllocationService.getAllocationMap(result).then(function (mapData) {
                        var mapOptions = {
                            mapImageUrl: mapData.mapUrl,
                            height: mapData.height || 400,
                            width: mapData.width || 400
                        }
                        var mapFeatures = [JSON.parse(mapData.roomFeature), JSON.parse(mapData.beaconPosition)];

                        $mdDialog.show({
                            templateUrl: 'js/dashboard/view/' + templateName + '.html',
                            parent: angular.element(document.body),
                            controller: 'AssetViewController',
                            controllerAs: 'assetDetails',
                            locals: {
                                allocation: result,
                                mapOptions: mapOptions,
                                mapFeatures: mapFeatures,
                                page:1
                            },
                            bindToController: true,
                            escapeToClose: false,
                            fullscreen: true,
                            clickOutsideToClose: true
                        })
                        .then(function (result) {
                            //TODO: any actions after accept
                        }, function () {
                            //TODO: any cleanup after cancel
                        });
                    })

                }, function (error) {

                });
        }

        function locateAsset(allocation) {
            
        }
    }
})();
/**
 * @ngdoc controller
 * @name ilWebClient.controller:PatientsTabController
 * @description
 * Controller for the patients tab on dashboard.
 */
(function() {
    'use strict';

    PatientsTabController.$inject = ["$scope", "$mdDialog", "CrudFactory", "UserService", "BeaconAllocationService"];
    angular.module('ilWebClient')
    .config(['$stateProvider', function($stateProvider) {
        $stateProvider
        .state('main.dashboard.patients', {
            url: '/patients',
            component: 'patientsTabController',
            resolve: {
                layout: function () {
                    return 'column';
                },
                layoutFill: function() {
                    return true;
                }
            }
        });
    }])
    .component('patientsTabController', {
        templateUrl: 'js/dashboard/tabs/patients/db-patients-tab.html',
        controller: PatientsTabController,
        controllerAs: 'patientsTab',
        bindings: {
            filters: '<',
            viewState: '<',
            layout: '@',
            layoutFill: '@'
        }
      });

    function PatientsTabController($scope, $mdDialog, CrudFactory, UserService, BeaconAllocationService) {
        var patientsTab = this;
        patientsTab.cards = [];
        patientsTab.allocations = [];
        patientsTab.filtersApplied = false;
        patientsTab.ROLES = UserService.getRoles();
        
        patientsTab.currentPage = 1;
        patientsTab.pages = 100;

        patientsTab.columns = {
            allocationName: {
                name: 'PATIENT ID'
            },
            patientViewName: {
                name: 'PATIENT NAME',
                hideColumn: function (item, column) {
                    return patientsTab.ROLES.GPER;
                }
            },
            surgeryType: {
                name: 'PROCEDURE'
            },
            surgeryDateTime: {
                name: 'PROCEDURE TIME',
                isDate: true
            },
            physician: {
                name: 'PHYSICIAN'
            },
            nurseName: {
                name: 'NURSE'
            },
            anesthesologist: {
                name: 'ANESTEHSOLOGIST'
            },
            location: {
                name: 'LOCATION',
                displayProperty: 'room',
                hideColumn: function (item, column) {
                    return !item.location || !item.location.isCurrent;
                },
                getValue: function (item, column) {
                    if (!this.hideColumn(item, column)) {
                        return getConcatLocation(item, column);
                    } else {
                        return '-';
                    }
                }
            },
            lastKnownLocation: {
                name: 'LAST KNOWN LOCATION',
                columnAlias: 'location',
                displayProperty: 'room',
                hideColumn: function (item, column) {
                    return !item.location || item.location.isCurrent;
                },
                getValue: function (item, column) {
                    if (!this.hideColumn(item, column)) {
                        return getConcatLocation(item, column);
                    } else {
                        return '-';
                    }
                }
            },
            assetDescription: {
                name: 'DESCRIPTION'
            }
        };

        patientsTab.actions = [
            {
                icon: 'notifications_none',
                hidden: true,
                onAction: toggleNotification
            },
            {
                icon: 'message',
                hidden: false,
                onAction: sendMessage
            },
            {
                icon: 'gps_fixed',
                onAction: locatePatient
            },
            {
                icon: 'info',
                onAction: getPatientDetails
            }
        ];

        patientsTab.onNewPage = function() {
            console.log('New Page');
        };

        function getAssetDetails(allocation) {

        }

        patientsTab.$onChanges = function(changes) {
            if (changes.filters && !angular.equals(changes.filters.previousValue, {})) {
                patientsTab.filtersApplied = checkAppliedFilters();
                loadAssets();
            }
        };

        loadAssets();

        function loadAssets() {
            var beaconRestService = new CrudFactory.CrudRest('beacon-allocation');
            beaconRestService.list(patientsTab.filters).then(function (result) {
                result.forEach(function (item) {
                    if(patientsTab.allocations.filter(function(asset){return asset.allocationId === item.allocationId;}).length === 0){
                        patientsTab.allocations.push(item);
                    }
                });
            });
        }

        // Duplicated function. We should add it in a more universal location.
        function checkAppliedFilters() {
            // Returns true if filters are applied
        }

        function getPatientName(cardItem) {
            if (typeof cardItem.meta === 'string') {
                return JSON.parse(cardItem.meta).patientName.toUpperCase();
            } else {
                return cardItem.meta.patientName.toUpperCase();
            }
        }

        function getConcatLocation(item, column) {
            if (!item.location || (!item.location.area && !item.location.room)) {
                return '-';
            } else if (item.location.area && !item.location.room) {
                return item.location.area;
            } else if (!item.location.area && item.location.room) {
                return item.location.room;
            } else {
                return item.location.area + ', ' + item.location.room;
            }
        }

        /* Action Functions */
        function toggleNotification(card) {
            console.log('Setting notification for ' + card.title);
        }

        function sendMessage(card) {
            console.log('Sending message to ' + card.title);
        }

        function getPatientDetails(allocation) {
            console.log('Getting details for ' + allocation.allocationName);

            if (patientsTab.ROLES.GPER) {
                return;
            }

            BeaconAllocationService
                .getAllocation(allocation)
                .then(function (result) {
                    result.location = allocation.location;
                    result.locationLabel = allocation.locationLabel;
                    result.entryDate = allocation.entryDate;
                    BeaconAllocationService.getAllocationMap(result).then(function (mapData) {
                        var mapOptions = {
                            mapImageUrl: mapData.mapUrl,
                            height: mapData.height || 400,
                            width: mapData.width || 400
                        }
                        var mapFeatures = [JSON.parse(mapData.roomFeature), JSON.parse(mapData.beaconPosition)];

                        $mdDialog.show({
                            templateUrl: 'js/dashboard/view/patient_location.html',
                            parent: angular.element(document.body),
                            controller: 'PatientViewController',
                            controllerAs: 'patientDetails',
                            locals: {
                                allocation: result,
                                mapOptions: mapOptions,
                                mapFeatures: mapFeatures,
                                page:1
                            },
                            bindToController: true,
                            escapeToClose: false,
                            fullscreen: true,
                            clickOutsideToClose: true
                        })
                        .then(function (result) {
                            //TODO: any actions after accept
                        }, function () {
                            //TODO: any cleanup after cancel
                        });
                    })

                }, function (error) {

                });
        }

        function locatePatient(allocation) {

        }

        function sendMessage(allocation) {
            $mdDialog.show({
                templateUrl: 'js/dashboard/im/im.html',
                parent: angular.element(document.body),
                controller: 'IMFormController',
                locals: {
                    allocation: allocation
                },
                bindToController: true,
                escapeToClose: false,
                clickOutsideToClose: true,
                fullscreen: true
            })
            .then(function (result) {
                //TODO: any actions after im
            }, function () {
                //TODO: any cleanup after cancel
            });
        }

        function discard() {

        }
    }
})();
(function() {
    'use strict';
    
    AreaAllocationController.$inject = ["$mdDialog"];
    angular.module('ilWebClient')
    .controller('areaAllocation', AreaAllocationController);

    /* All dialogs require developer to pass controllerAs: 'modal' when showing dialog */
    function AreaAllocationController($mdDialog) {
        var modal = this;

        modal.saveDisabled = true;

        modal.area = {
            name: '',
            parent: '',
            defaultStatus: '',
            description: '',
            settings: {
                notfications: false,
                restricted: false,
                automaticDischarged: {
                    enabled: false,
                    delay: 0
                },
                alarm: {
                    enabled: false,
                    delay: 0
                }
            }
        };

        modal.close = function() {
            $mdDialog.hide();
        };

        modal.save = function() {
            // TODO: save data.
            $mdDialog.hide();
        };
    }
})();
(function() {
    'use strict';
    
    AssetAllocationController.$inject = ["$mdDialog"];
    angular.module('ilWebClient')
    .controller('assetAllocation', AssetAllocationController);

    /* All dialogs require developer to pass controllerAs: 'modal' when showing dialog */
    function AssetAllocationController($mdDialog) {
        var modal = this;

        modal.saveDisabled = true;
        modal.setGateway = false;

        modal.asset = {
            id: '',
            gateway: null,
            beacon: null,
            type: '',
            description: ''
        };


        modal.close = function() {
            $mdDialog.hide();
        };

        modal.save = function() {
            // TODO: save data.
            $mdDialog.hide();
        };
    }
})();
(function() {
    'use strict';

    PatientAllocationController.$inject = ["$mdDialog"];
    angular.module('ilWebClient')
    .controller('patientAllocation', PatientAllocationController);

    /* All dialogs require developer to pass controllerAs: 'modal' when showing dialog */
    function PatientAllocationController($mdDialog) {
        var modal = this;

        modal.saveDisabled = true;

        modal.patient = {
            information: {
                beacon: null,
                id: '',
                firstName: '',
                lastName: ''
            },
            description: {
                race: '',
                stature: '',
                hairColor: '',
                description: '',
                type: 'default'
            },
            procedure: {
                type: '',
                date: '',
                physician: '',
                anasthesiologist: '',
                nurse: ''
            },
            contact: {
                primary: '',
                associated: []
            }
        };

        // TODO: translation from input to patient contact
        modal.phone = {
            country: '',
            number: '',
        };


        modal.close = function() {
            $mdDialog.hide();
        };

        modal.save = function() {
            // TODO: save data.
            $mdDialog.hide();
        };
    }
})();