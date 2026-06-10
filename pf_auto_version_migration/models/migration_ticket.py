# -*- coding: utf-8 -*-

from odoo import models, fields ,api
from odoo import release
from odoo.exceptions import ValidationError, UserError
import logging
_logger = logging.getLogger(__name__)

class MigrationTicket(models.Model):
    _name = 'pf.migration.ticket'
    _description = 'Migration Ticket'
    _rec_name = "ticket_number"


    ticket_number = fields.Char(string='Ticket Number')
    description = fields.Html(sanitize_attributes=False)
