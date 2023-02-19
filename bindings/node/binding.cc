#include "tree_sitter/parser.h"
#include <node.h>
#include "nan.h"

using namespace v8;

extern "C" TSLanguage * tree_sitter_nominalscript();

namespace {

NAN_METHOD(New) {}

void Init(Local<Object> exports, Local<Object> module) {
  Local<FunctionTemplate> ts_tpl = Nan::New<FunctionTemplate>(New);
  ts_tpl->SetClassName(Nan::New("Language").ToLocalChecked());
  ts_tpl->InstanceTemplate()->SetInternalFieldCount(1);
  Local<Function> ts_constructor = Nan::GetFunction(ts_tpl).ToLocalChecked();
  Local<Object> ts_instance = ts_constructor->NewInstance(Nan::GetCurrentContext()).ToLocalChecked();
  Nan::SetInternalFieldPointer(ts_instance, 0, tree_sitter_nominalscript());
  Nan::Set(ts_instance, Nan::New("name").ToLocalChecked(), Nan::New("nominalscript").ToLocalChecked());

  Nan::Set(exports, Nan::New("nominalscript").ToLocalChecked(), ts_instance);
}

NODE_MODULE(tree_sitter_nominalscript_binding, Init)

}  // namespace
