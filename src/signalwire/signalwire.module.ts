import { Module } from '@nestjs/common';
import { SignalwireService } from './signalwire.service';

@Module({
  providers: [SignalwireService],
  exports: [SignalwireService],
})
export class SignalwireModule {}
