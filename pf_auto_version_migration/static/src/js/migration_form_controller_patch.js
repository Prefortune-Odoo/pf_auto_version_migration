/** @odoo-module **/

import { FormController } from "@web/views/form/form_controller";
import { patch } from "@web/core/utils/patch";
import { onWillUnmount } from "@odoo/owl";
import { rpc } from "@web/core/network/rpc";

patch(FormController.prototype, {
    setup() {
        super.setup();
        console.log('[Migration Status] Setting up form controller');
    }
});
