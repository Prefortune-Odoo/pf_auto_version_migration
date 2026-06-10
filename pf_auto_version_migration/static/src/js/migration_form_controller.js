/** @odoo-module **/

import { registry } from "@web/core/registry";
import { FormController } from "@web/views/form/form_controller";
import { formView } from "@web/views/form/form_view";
import { useService } from "@web/core/utils/hooks";
import { useEffect } from "@odoo/owl";

export class MigrationFormController extends FormController {
    setup() {
        super.setup();
        this.rpc = useService("rpc");
        console.log('[Migration Status] MigrationFormController setup called');
        
        // Use useEffect to monitor state changes reactively
        useEffect(
            (activeState) => {
                if (activeState === 'finish') {
                    // REMOVED the setTimeout delay! 
                    // This forces the check to happen instantly so the loader doesn't flash.
                    this._callMigrationStatusAPI();
                }
            },
            () => [this.model.root.data.active_state]
        );
    }

    /**
     * Call migration status API using RPC
     */
    async _callMigrationStatusAPI() {
        console.log('[Migration Status] Evaluating migration status...');
        
        const loadingDiv = document.getElementById('migration-loading');
        const statusMessageDiv = document.getElementById('migration-status-message');
        const MigrationForm = document.querySelector('.migration-fields');
        const createTicketButton = document.getElementById('create_ticket_button');

        // -------------------------------------------------------------
        // 1. CUSTOM MODULES INTERCEPTOR (Instant check)
        // -------------------------------------------------------------
        const customModulesCount = this.model.root.data.total_list_of_custom_modules || 0;
        
        if (customModulesCount > 0) {
            console.log('[Migration Status] Custom modules found. Hiding loader instantly.');
            
            // Instantly and aggressively hide the loading screen using !important
            if (loadingDiv) {
                loadingDiv.setAttribute('style', 'display: none !important'); 
            }

            const customMessage = "Due to the presence of custom modules/apps in your Odoo instance, an automated migration is not possible in this case.\nAs a valued customer, we will be happy to assist you with a manual migration process. To proceed, please provide the information requested below so that we can create a support ticket for our technical team.\nOnce the details are submitted, our team will review your environment and contact you within 48 hours with the next steps and migration recommendations.";

            if (statusMessageDiv) {
                statusMessageDiv.innerHTML = `
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                        <p style="margin: 0; color: #0c5460; font-size: 0.95rem; white-space: pre-line;">
                            <i class="fa fa-exclamation-triangle"></i>
                            <strong>Important:</strong> ${customMessage}
                        </p>
                    </div>
                `;
                statusMessageDiv.setAttribute('style', 'display: block !important');
                statusMessageDiv.style.animation = 'fadeIn 0.5s ease-in';
            }
            
            if (createTicketButton) createTicketButton.style.display = 'block';
            if (MigrationForm) {
                MigrationForm.style.display = 'block';
                MigrationForm.style.animation = 'fadeIn 0.5s ease-in';
            }
            
            return; // EXIT EARLY: Do not call the server RPC
        }

        // -------------------------------------------------------------
        // 2. DEFAULT MODULES - PROCEED TO SERVER URL
        // -------------------------------------------------------------
        console.log('[Migration Status] Calling migration status API using RPC...');
        if (loadingDiv) {
            // Ensure loader is visible only for default modules
            loadingDiv.setAttribute('style', 'display: block !important'); 
        }

        try {
            const result = await this.rpc('/pf_auto_version_migration/migration/status', {
                jsonrpc: '2.0',
                method: 'call',
                params: {},
                id: 1
            });
            
            console.log('[Migration Status] RPC Response:', result);
            
            // Hide loading div after receiving the response
            if (loadingDiv) {
                loadingDiv.setAttribute('style', 'display: none !important');
            }
            
            let message = '';
            if (result && result.status === 'success' && result.result) {
                const apiResult = result.result;
                message = apiResult.result?.message || apiResult.message || result.result?.message || '';
            } else if (result && result.message) {
                message = result.message;
            }
            
            if (statusMessageDiv && message) {
                statusMessageDiv.innerHTML = `
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                        <p style="margin: 0; color: #0c5460; font-size: 0.95rem; white-space: pre-line;">
                            <i class="fa fa-exclamation-triangle"></i>
                            <strong>Important:</strong> ${message}
                        </p>
                    </div>
                `;
                statusMessageDiv.setAttribute('style', 'display: block !important');
                statusMessageDiv.style.animation = 'fadeIn 0.5s ease-in';
                if (createTicketButton) createTicketButton.style.display = 'block';
                if (MigrationForm) {
                    MigrationForm.style.display = 'block';
                    MigrationForm.style.animation = 'fadeIn 0.5s ease-in';
                }
            }
        } catch (error) {
            console.error('[Migration Status] RPC Error:', error);
            if (loadingDiv) {
                loadingDiv.setAttribute('style', 'display: none !important');
            }
            if (statusMessageDiv) {
                statusMessageDiv.innerHTML = `
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                        <p style="margin: 0; color: #0c5460; font-size: 0.95rem;">
                            <i class="fa fa-exclamation-triangle"></i>
                            <strong>Important:</strong> This operation may affect your system configuration. Ensure you have a backup before proceeding.
                        </p>
                    </div>
                `;
                statusMessageDiv.setAttribute('style', 'display: block !important');
                statusMessageDiv.style.animation = 'fadeIn 0.5s ease-in';
            }
        }
    }
}

export const MigrationPopUpFormView = {
    ...formView,
    Controller: MigrationFormController,
};

registry.category("views").add("pf_migration_wizard_form_view_js", MigrationPopUpFormView);