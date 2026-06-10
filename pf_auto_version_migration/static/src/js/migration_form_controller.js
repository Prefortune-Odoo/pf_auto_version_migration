odoo.define('pf_auto_version_migration.migration_form_controller', function (require) {
    'use strict';

    var FormController = require('web.FormController');
    var FormView = require('web.FormView');
    var viewRegistry = require('web.view_registry');

    var MigrationFormController = FormController.extend({

        /**
         * Called when the controller is started
         */
        start: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                console.log("[Migration Status] MigrationFormController started");
                
                // Hide create button initially
                setTimeout(function () {
                    var createBtn = document.getElementById('create_ticket_button');
                    if (createBtn) {
                        createBtn.style.display = 'none';
                        createBtn.classList.remove('o_invisible_modifier');
                        createBtn.removeAttribute('disabled');
                    }
                }, 10);
                
                var record = self.model.get(self.handle);
                if (!record) return;

                if (record.data.active_state === 'finish') {
                    // Removed the 500ms and 2000ms delay to prevent the loader from flashing!
                    setTimeout(function () {
                        self._callMigrationStatusAPI();
                    }, 50); // Tiny 50ms delay just to ensure DOM elements are fully attached
                }
            });
        },

        on_attach_callback: function () {
            this._super.apply(this, arguments);
            var MigrationForm = document.querySelector('.migration-fields');
            if(MigrationForm){
                MigrationForm.style.display = 'none';
            }
        },

        /**
         * Call migration status API using RPC
         */
        _callMigrationStatusAPI: function () {
            var self = this;

            var loadingDiv = document.getElementById('migration-loading');
            var statusMessageDiv = document.getElementById('migration-status-message');
            var MigrationForm = document.querySelector('.migration-fields');
            var createBtn = document.getElementById('create_ticket_button');

            // Get current record data
            var record = this.model.get(this.handle);
            
            // -------------------------------------------------------------
            // 1. CUSTOM MODULES INTERCEPTOR (Instant check)
            // -------------------------------------------------------------
            var customModulesCount = (record && record.data && record.data.total_list_of_custom_modules) ? record.data.total_list_of_custom_modules : 0;
            
            if (customModulesCount > 0) {
                console.log('[Migration Status] Custom modules found. Hiding loader instantly.');
                
                // Instantly and aggressively hide the loading screen using !important
                if (loadingDiv) {
                    loadingDiv.setAttribute('style', 'display: none !important');
                }

                var customMessage = "Due to the presence of custom modules/apps in your Odoo instance, an automated migration is not possible in this case.\nAs a valued customer, we will be happy to assist you with a manual migration process. To proceed, please provide the information requested below so that we can create a support ticket for our technical team.\nOnce the details are submitted, our team will review your environment and contact you within 48 hours with the next steps and migration recommendations.";

                if (statusMessageDiv) {
                    statusMessageDiv.innerHTML =
                        '<div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">' +
                            '<p style="margin: 0; color: #0c5460; font-size: 0.95rem; white-space: pre-line;">' +
                                '<i class="fa fa-exclamation-triangle"></i> ' +
                                '<strong>Important:</strong> ' + customMessage +
                            '</p>' +
                        '</div>';
                    
                    statusMessageDiv.setAttribute('style', 'display: block !important');
                }

                if (createBtn) createBtn.style.display = 'block';
                if (MigrationForm) MigrationForm.style.display = 'block';
                
                return; // EXIT EARLY: Do not call the server RPC below
            }

            // -------------------------------------------------------------
            // 2. DEFAULT MODULES - PROCEED TO SERVER URL
            // -------------------------------------------------------------
            console.log('[Migration Status] Calling migration status API using RPC...');
            
            if (loadingDiv) {
                loadingDiv.setAttribute('style', 'display: block !important');
            }

            this._rpc({
                route: '/pf_auto_version_migration/migration/status',
                params: {},
            }).then(function (result) {
                
                // Hide loading div after receiving response
                if (loadingDiv) {
                    loadingDiv.setAttribute('style', 'display: none !important');
                }

                var message = '';

                if (result && result.status === 'success' && result.result) {
                    var apiResult = result.result;

                    if (apiResult.result && apiResult.result.message) {
                        message = apiResult.result.message;
                    } else if (apiResult.message) {
                        message = apiResult.message;
                    } else if (result.result && result.result.message) {
                        message = result.result.message;
                    }
                } else if (result && result.message) {
                    message = result.message;
                }

                if (statusMessageDiv && message) {
                    statusMessageDiv.innerHTML =
                        '<div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">' +
                            '<p style="margin: 0; color: #0c5460; font-size: 0.95rem; white-space: pre-line;">' +
                                '<i class="fa fa-exclamation-triangle"></i> ' +
                                '<strong>Important:</strong> ' + message +
                            '</p>' +
                        '</div>';
                    
                    statusMessageDiv.setAttribute('style', 'display: block !important');
                    if (createBtn) createBtn.style.display = 'block';
                    if (MigrationForm) MigrationForm.style.display = 'block';
                    
                } else {
                    console.warn('[Migration Status] No message found in response');
                }

            }).guardedCatch(function (error) {
                console.error('[Migration Status] RPC Error:', error);

                if (loadingDiv) {
                    loadingDiv.setAttribute('style', 'display: none !important');
                }

                if (statusMessageDiv) {
                    statusMessageDiv.innerHTML =
                        '<div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">' +
                            '<p style="margin: 0; color: #0c5460; font-size: 0.95rem;">' +
                                '<i class="fa fa-exclamation-triangle"></i> ' +
                                '<strong>Important:</strong> This operation may affect your system configuration. Ensure you have a backup before proceeding.' +
                            '</p>' +
                        '</div>';

                    statusMessageDiv.setAttribute('style', 'display: block !important');
                }
            });
        },
    });

    var MigrationPopUpFormView = FormView.extend({
        config: _.extend({}, FormView.prototype.config, {
            Controller: MigrationFormController,
        }),
    });

    viewRegistry.add('pf_migration_wizard_form_view_js', MigrationPopUpFormView);

    return {
        MigrationFormController: MigrationFormController,
        MigrationPopUpFormView: MigrationPopUpFormView,
    };
});