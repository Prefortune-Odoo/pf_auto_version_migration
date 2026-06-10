/** @odoo-module **/

import { registry } from "@web/core/registry";
import { FormController } from "@web/views/form/form_controller";
import { formView } from "@web/views/form/form_view";
import { rpc } from "@web/core/network/rpc";
import { onMounted } from "@odoo/owl";

export class MigrationFormController extends FormController {
    setup() {
        super.setup();

        onMounted(() => {
            const createTicketButton = document.getElementById('create_ticket_button');
            if (createTicketButton) {
                createTicketButton.style.display = 'none';
            }
            this._callMigrationStatusAPI();
        });
    }

    async _callMigrationStatusAPI() {
        const loadingDiv = document.getElementById('migration-loading');
        const statusMessageDiv = document.getElementById('migration-status-message');
        const MigrationForm = document.querySelector('.migration-fields');
        const createTicketButton = document.getElementById('create_ticket_button');

        // Check custom modules count from the current record data
        const customModulesCount = this.model.root.data.total_list_of_custom_modules || 0;
        if (customModulesCount > 0) {
            if (loadingDiv) {
                loadingDiv.style.display = 'none'; 
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
                statusMessageDiv.style.display = 'block';
                statusMessageDiv.style.animation = 'fadeIn 0.5s ease-in';
            }
            
            if (createTicketButton) createTicketButton.style.display = 'block';
            if (MigrationForm) {
                MigrationForm.style.display = 'block';
                MigrationForm.style.animation = 'fadeIn 0.5s ease-in';
            }
            
            return; //Do not execute the server RPC call
        }

        // Display loader, proceed with RPC call
        if (loadingDiv) {
            loadingDiv.style.display = 'block'; // Ensure loading text is visible
        }

        try {
            const result = await rpc('/pf_auto_version_migration/migration/status', {
                jsonrpc: '2.0',
                method: 'call',
                params: {},
                id: 1
            });
            
            // Hide loading div after response
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
            }
            
            let message = '';
            if (result && result.status === 'success' && result.result) {
                const apiResult = result.result;
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
                statusMessageDiv.innerHTML = `
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                        <p style="margin: 0; color: #0c5460; font-size: 0.95rem; white-space: pre-line;">
                            <i class="fa fa-exclamation-triangle"></i>
                            <strong>Important:</strong> ${message}
                        </p>
                    </div>
                `;
                if (createTicketButton) createTicketButton.style.display = 'block';
                statusMessageDiv.style.display = 'block';
                statusMessageDiv.style.animation = 'fadeIn 0.5s ease-in';
                if (MigrationForm) {
                    MigrationForm.style.display = 'block';
                    MigrationForm.style.animation = 'fadeIn 0.5s ease-in';
                }
            }
        } catch (error) {
            if (loadingDiv) {
                loadingDiv.style.display = 'none';
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
                statusMessageDiv.style.display = 'block';
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
