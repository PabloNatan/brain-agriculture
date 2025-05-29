import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class RedirectController {
  @Get()
  @Redirect('/docs', 302)
  redirectToSpecs() {}
}
