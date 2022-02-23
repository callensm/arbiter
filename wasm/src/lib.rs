#![allow(clippy::unused_unit)]

use hashusign::state::{Clerk, Document};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "getClerkSpace")]
pub fn get_clerk_space(size_limit: usize) -> usize {
    Clerk::space(size_limit)
}

#[wasm_bindgen(js_name = "getDocumentSpace")]
pub fn get_document_space(title_len: usize, num_participants: usize) -> usize {
    Document::space(title_len, num_participants)
}
