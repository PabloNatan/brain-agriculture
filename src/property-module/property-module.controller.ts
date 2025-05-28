import { Controller } from '@nestjs/common';
import { PropertyModuleService } from './property-module.service';

@Controller('property-module')
export class PropertyModuleController {
  constructor(private readonly propertyModuleService: PropertyModuleService) {}
}
